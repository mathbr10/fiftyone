import React from "react";
import { createBrowserHistory, createMemoryHistory } from "history";
import { Environment, loadQuery, PreloadedQuery } from "react-relay";
import {
  Environment,
  GraphQLResponse,
  Network,
  OperationType,
  RecordSource,
  Store,
  VariablesOf,
} from "relay-runtime";

import {
  FetchFunction,
  getFetchFunction,
  GraphQLError,
  isElectron,
  isNotebook,
  NotFoundError,
  Resource,
} from "@fiftyone/utilities";
import RouteDefinition, { RouteBase } from "./RouteDefinition";

import { MatchPathResult, matchPath } from "./matchPath";

export interface RouteData<
  T extends OperationType | undefined = OperationType
> {
  isExact: boolean;
  path: string;
  url: string;
  variables: T extends OperationType ? VariablesOf<T> : undefined;
}

export interface Entry<T extends OperationType | undefined = OperationType> {
  pathname: string;
  state: any;
  entries: {
    component: Resource<Route<T>>;
    prepared?: Resource<PreloadedQuery<T extends undefined ? never : T>>;
    routeData: RouteData<T>;
  }[];
}

export interface RoutingContext<
  T extends OperationType | undefined = OperationType
> {
  history: ReturnType<typeof createBrowserHistory>;
  get: () => Entry<T>;
  pathname: string;
  state: any;
  subscribe: (cb: (entry: Entry<T>) => void) => () => void;
}

interface Match<T extends OperationType | undefined = OperationType> {
  route: RouteDefinition<T>;
  match: RouteData<T>;
}

export interface Router<T extends OperationType | undefined = OperationType> {
  cleanup: () => void;
  context: RoutingContext<T>;
}

export const createRouter = (
  environment: Environment,
  routes: RouteDefinition[],
  { errors } = {
    errors: true,
  }
): Router<any> => {
  const history =
    isElectron() || isNotebook()
      ? createMemoryHistory()
      : createBrowserHistory();

  let currentEntry: Entry;

  let nextId = 0;
  const subscribers = new Map();

  const cleanup = history.listen(({ location }) => {
    if (!currentEntry) {
      return;
    }

    const matches = matchRoute(
      routes,
      location.pathname,
      errors,
      location.state?.variables as Partial<VariablesOf<any>>
    );
    const entries = prepareMatches(environment, matches);
    const nextEntry: Entry<any> = {
      pathname: location.pathname,
      state: location.state,
      entries,
    };
    currentEntry = nextEntry;
    subscribers.forEach((cb) => cb(nextEntry));
  });

  const context: RoutingContext = {
    history,
    get() {
      if (!currentEntry) {
        currentEntry = {
          pathname: history.location.pathname,
          state: history.location.state,
          entries: prepareMatches(
            environment,
            matchRoute(
              routes,
              history.location.pathname,
              errors,
              history.location.state?.variables as Partial<VariablesOf<any>>
            )
          ),
        };
      }
      return currentEntry;
    },
    get pathname() {
      return history.location.pathname;
    },
    get state() {
      return history.location.state;
    },
    subscribe(cb) {
      const id = nextId++;
      const dispose = () => {
        subscribers.delete(id);
      };
      subscribers.set(id, cb);
      return dispose;
    },
  };

  return {
    cleanup,
    context,
  };
};

export const matchRoutes = <
  T extends OperationType | undefined = OperationType
>(
  routes: RouteBase<T>[],
  pathname: string,
  variables: T extends OperationType ? Partial<VariablesOf<T>> : undefined,
  branch: { route: RouteBase<T>; match: MatchPathResult<T> }[] = []
): { route: RouteBase<T>; match: MatchPathResult<T> }[] => {
  routes.some((route) => {
    const match = route.path
      ? matchPath(pathname, route, variables)
      : branch.length
      ? branch[branch.length - 1].match
      : ({
          path: "/",
          url: "/",
          variables,
          isExact: pathname === "/",
        } as MatchPathResult<T>);

    if (match) {
      branch.push({ route, match });

      if (route.children) {
        matchRoutes(route.children, pathname, variables, branch);
      }
    }

    return match;
  });

  return branch;
};

const matchRoute = <T extends OperationType | undefined = OperationType>(
  routes: RouteDefinition<T>[],
  pathname: string,
  errors: boolean,
  variables: T extends OperationType ? Partial<VariablesOf<T>> : undefined
): Match<T>[] => {
  const matchedRoutes = matchRoutes(routes, pathname, variables);

  if (
    errors &&
    matchedRoutes &&
    matchedRoutes.every(({ match }) => !match.isExact)
  ) {
    throw new NotFoundError(pathname);
  }

  return matchedRoutes;
};

const prepareMatches = <T extends OperationType | undefined = OperationType>(
  environment: Environment,
  matches: Match<T>[]
) => {
  return matches
    ? matches.map((match) => {
        const { route, match: matchData } = match;

        const query = route.query?.get();
        const component = route.component.get();
        if (component == null) {
          route.component.load();
        }

        if (route.query && query == null) {
          route.query.load();
        }

        const routeQuery = route.query;
        if (routeQuery !== undefined) {
          const prepared = new Resource(() =>
            routeQuery.load().then((q) => {
              return loadQuery(environment, q, matchData.variables || {}, {
                fetchPolicy: "network-only",
              });
            })
          );

          prepared.load();

          return {
            component: route.component,
            prepared,
            routeData: matchData,
          };
        }

        return {
          component: route.component,
          routeData: matchData,
        };
      })
    : [];
};

async function fetchGraphQL(
  text: string | null | undefined,
  variables: object
): Promise<GraphQLResponse> {
  const data = await getFetchFunction()<unknown, GraphQLResponse>(
    "POST",
    "/graphql",
    {
      query: text,
      variables,
    }
  );

  if ("errors" in data && data.errors) {
    throw new GraphQLError(data.errors as unknown as GraphQLError[]);
  }
  return data;
}

const fetchRelay: FetchFunction = async (params, variables) => {
  return fetchGraphQL(params.text, variables);
};

export const getEnvironment = () =>
  new Environment({
    network: Network.create(fetchRelay),
    store: new Store(new RecordSource()),
  });

export const RouterContext = React.createContext(
  createRouter(getEnvironment(), [], { errors: false }).context
);
