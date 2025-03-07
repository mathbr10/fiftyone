import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRecoilCallback, useRecoilValue } from "recoil";
import { v4 as uuid } from "uuid";

import Flashlight from "@fiftyone/flashlight";
import { freeVideos } from "@fiftyone/looker";

import { flashlightLooker } from "./Grid.module.css";
import { rowAspectRatioThreshold } from "./recoil";
import useResize from "./useResize";
import usePage from "./usePage";
import useExpandSample from "./useExpandSample";
import { useEventHandler } from "@fiftyone/state";

import * as fos from "@fiftyone/state";
import { stringifyObj } from "@fiftyone/state";
import { deferrer } from "@fiftyone/state";

const Grid: React.FC<{}> = () => {
  const [id] = useState(() => uuid());
  const store = fos.useLookerStore();
  const expandSample = useExpandSample(store);
  const initialized = useRef(false);
  const deferred = deferrer(initialized);
  const lookerOptions = fos.useLookerOptions(false);
  const createLooker = fos.useCreateLooker(false, true, lookerOptions);
  const selected = useRecoilValue(fos.selectedSamples);
  const [next, pager] = usePage(false, store);
  const threshold = useRecoilValue(rowAspectRatioThreshold);
  const resize = useResize();

  const [flashlight] = useState(() => {
    const flashlight = new Flashlight<number>({
      horizontal: false,
      initialRequestKey: 1,
      options: { rowAspectRatioThreshold: threshold, offset: 60 },
      onItemClick: expandSample,
      onResize: resize.current,
      onItemResize: (id, dimensions) =>
        store.lookers.has(id) && store.lookers.get(id)?.resize(dimensions),
      get: pager,
      render: (id, element, dimensions, soft, hide) => {
        const result = store.samples.get(id);

        if (store.lookers.has(id)) {
          const looker = store.lookers.get(id);
          hide ? looker?.disable() : looker?.attach(element, dimensions);

          return;
        }

        if (!createLooker.current || !result || !selectSample.current) {
          throw new Error("bad data");
        }

        if (!soft) {
          const looker = createLooker.current(result);
          looker.addEventListener(
            "selectthumbnail",
            ({ detail }: CustomEvent) => {
              selectSample.current(flashlight, detail);
            }
          );

          store.lookers.set(id, looker);
          looker.attach(element, dimensions);
        }
      },
    });

    return flashlight;
  });

  const select = fos.useSelectFlashlightSample();
  const selectSample = useRef(select);
  selectSample.current = select;

  useLayoutEffect(
    deferred(() =>
      flashlight.updateOptions({ rowAspectRatioThreshold: threshold })
    ),
    [threshold]
  );

  useLayoutEffect(
    deferred(() => {
      flashlight.updateItems((sampleId) =>
        store.lookers.get(sampleId)?.updateOptions({
          ...lookerOptions,
          selected: selected.has(sampleId),
        })
      );
    }),
    [lookerOptions, selected]
  );

  useLayoutEffect(() => {
    flashlight.attach(id);
    return () => flashlight.detach();
  }, [flashlight, id]);
  const taggingLabels = useRecoilValue(
    fos.tagging({ modal: false, labels: true })
  );

  const taggingSamples = useRecoilValue(
    fos.tagging({ modal: false, labels: false })
  );
  const isTagging = taggingLabels || taggingSamples;

  useLayoutEffect(
    deferred(() => {
      if (isTagging || !flashlight.isAttached()) {
        return;
      }

      next.current = 0;
      flashlight.reset();
      store.reset();
      freeVideos();
    }),
    [
      stringifyObj(useRecoilValue(fos.filters)),
      useRecoilValue(fos.datasetName),
      useRecoilValue(fos.cropToContent(false)),
      fos.filterView(useRecoilValue(fos.view)),
      useRecoilValue(fos.groupSlice(false)),
      useRecoilValue(fos.refresher),
      useRecoilValue(fos.similarityParameters),
      useRecoilValue(fos.selectedMediaField(false)),
      useRecoilValue(fos.extendedStagesUnsorted),
    ]
  );

  useEventHandler(
    document,
    "keydown",
    useRecoilCallback(
      ({ snapshot, set }) =>
        async (event: KeyboardEvent) => {
          if (event.key !== "Escape") {
            return;
          }

          if (!(await snapshot.getPromise(fos.modal))) {
            set(fos.selectedSamples, new Set());
          }
        },
      []
    )
  );

  useEffect(() => {
    initialized.current = true;
  }, []);

  return <div id={id} className={flashlightLooker}></div>;
};

export default Grid;
