import { Tooltip, useTheme } from "@fiftyone/components";
import React, { useState } from "react";
import styled from "styled-components";
import { animated, useSpring, useSprings } from "@react-spring/web";
import { KeyboardArrowUp, KeyboardArrowDown } from "@mui/icons-material";

export const Box = styled.div`
  padding: 1em;
  box-sizing: border-box;
  background-color: ${({ theme }) => theme.background.body};
`;

export const VerticalSpacer = styled.div`
  height: ${({ height }) =>
    typeof height == "number" ? height + "px" : height};
  background-color: ${({ opaque, theme }) =>
    opaque ? theme.background.body : undefined};
`;

export const scrollbarStyles = ({ theme }) => `
::-webkit-scrollbar {
  width: 16px;
}

scrollbar-color: ${({ theme }) => theme.text.tertiary} ${({ theme }) =>
  theme.background.body};

  scrollbar-gutter: stable;

  scrollbar-width: auto;

::-webkit-scrollbar-track {
  border: solid 4px transparent ${theme.text.tertiary};
}

@-moz-document url-prefix() {
  padding-right: 16px;
}

::-webkit-scrollbar-thumb {
  box-shadow: inset 0 0 10px 10px transparent;
  border: solid 4px transparent;
  border-radius: 16px;
  transition: box-shadow linear 0.5s;
}
&:hover::-webkit-scrollbar-thumb {
  box-shadow: inset 0 0 10px 10px ${theme.text.tertiary};
}
`;

export const ContentDiv = styled.div`
  box-sizing: border-box;
  border-radius: 3px;
  background-color: ${({ theme }) => theme.background.level3};
  color: ${({ theme }) => theme.text.secondary};
  border: 1px solid ${({ theme }) => theme.primary.plainBorder};
  box-shadow: 0 8px 15px 0 rgba(0, 0, 0, 0.43);
  border-radius: 2px;
  padding: 0.5rem;
  line-height: 1rem;
  margin-top: 2.5rem;
  font-weight: bold;
  width: auto;
  z-index: 802;
`;

export const ContentHeader = styled.div`
  color: ${({ theme }) => theme.text.primary};
  display: flex;
  padding-bottom: 0.5rem;
`;

const PillButtonDiv = animated(styled.div`
  line-height: 1.5rem;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  background-color: ${({ theme }) => theme.divider};
  border-radius: 1rem;
  border: none;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  opacity: 1;

  & > span {
    text-align: center;
    margin: 0 0.25rem;
  }
  & > svg {
    display: inline-block;
    height: 100%;
  }
`);

type PillButton = {
  onClick: (event: Event) => void;
  open: boolean;
  highlight: boolean;
  text?: string;
  icon?: any;
  arrow?: boolean;
  style?: React.CSSProperties;
  title: string;
};

export const PillButton = React.memo(
  React.forwardRef(
    (
      {
        onClick,
        open,
        text,
        icon,
        highlight,
        arrow = false,
        style,
        title,
      }: PillButton,
      ref
    ) => {
      const theme = useTheme();
      const props = useSpring({
        backgroundColor: !highlight
          ? theme.background.button
          : theme.primary.plainColor,
        color: !highlight ? theme.text.secondary : theme.text.buttonHighlight,
      });

      const children = (
        <PillButtonDiv
          onClick={(e) => {
            onClick(e);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          ref={ref}
          style={{ ...props, ...style }}
          title={title}
        >
          {text && <span>{text}</span>}
          {icon}
          {arrow && (open ? <KeyboardArrowUp /> : <KeyboardArrowDown />)}
        </PillButtonDiv>
      );
      return title ? (
        <Tooltip text={title}>{children}</Tooltip>
      ) : (
        <>{children}</>
      );
    }
  )
);

export const PopoutDiv = animated(styled.div`
  background-color: ${({ theme }) => theme.background.level2};
  border: 1px solid ${({ theme }) => theme.primary.plainBorder};
  border-radius: 2px;
  box-shadow: 0 2px 20px ${({ theme }) => theme.custom.shadow};
  box-sizing: border-box;
  margin-top: 0.6rem;
  position: absolute;
  width: auto;
  z-index: 801;
  font-size: 14px;
  padding: 0 0.5rem 0 0.5rem;
  min-width: 14rem;
`);

export const PopoutSectionTitle = styled.div`
  margin: 0 -0.5rem;
  padding: 0 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.background.level1};
  font-size: 1rem;
  line-height: 2;
  font-weight: bold;
`;

const TabOptionDiv = animated(styled.div`
  display: flex;
  font-weight: bold;
  cursor: pointer;
  justify-content: space-between;
  margin: 0.5rem -0.5rem;
  height: 2rem;

  & > div {
    display: flex;
    flex-direction: column;
    align-content: center;
    cursor: inherit;
    flex-grow: 1;
    flex-basis: 0;
    text-align: center;Checkbox
    overflow: hidden;
  }
`);

const Tab = animated(styled.div``);

type TabOption = {
  text: string;
  onClick: () => void;
  title: string;
};

export type TabOptionProps = {
  active: string;
  options: TabOption[];
  color?: string;
};

export const TabOption = ({ active, options, color }: TabOptionProps) => {
  const theme = useTheme();
  const [hovering, setHovering] = useState(options.map((o) => false));
  const styles = useSprings(
    options.length,
    options.map((o, i) => ({
      backgroundColor:
        o.text === active
          ? color || theme.primary.plainColor
          : hovering[i]
          ? theme.background.body
          : theme.background.level2,
      color: hovering ? theme.text.primary : theme.text.secondary,
    }))
  );

  const [style, set] = useSpring(() => ({
    background: theme.background.level1,
  }));

  return (
    <TabOptionDiv
      style={style}
      onMouseEnter={() => set({ background: theme.background.body })}
      onMouseLeave={() => set({ background: theme.background.level1 })}
    >
      {options.map(({ text, title, onClick }, i) => (
        <Tab
          onClick={onClick}
          title={title}
          style={{
            ...styles[i],
            cursor: text === active ? "default" : "pointer",
          }}
          onMouseEnter={() =>
            setHovering(hovering.map((_, j) => (j === i ? true : _)))
          }
          onMouseLeave={() =>
            setHovering(hovering.map((_, j) => (j === i ? false : _)))
          }
          key={i}
        >
          {text}
        </Tab>
      ))}
    </TabOptionDiv>
  );
};

const ButtonDiv = animated(styled.div`
  cursor: pointer;
  margin-left: 0;
  margin-right: 0;
  padding: 2.5px 0.5rem;
  border-radius: 3px;
  display: flex;
  justify-content: space-between;
  margin-top: 3px;
`);

const OptionTextDiv = animated(styled.div`
  padding-right: 0.25rem;
  display: flex;
  justify-content: center;
  align-content: center;
  flex-direction: column;
  color: inherit;
  line-height: 1.7;
  & > span {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
`);

export const OptionText = ({ style, children }) => {
  return (
    <OptionTextDiv style={style}>
      <span>{children}</span>
    </OptionTextDiv>
  );
};

export const Button = ({
  onClick,
  text,
  children = null,
  style,
  color = null,
  title = null,
}) => {
  const theme = useTheme();
  const [hover, setHover] = useState(false);
  color = color ?? theme.primary.plainColor;
  const props = useSpring({
    backgroundColor: hover ? color : theme.background.body,
    color: hover ? theme.text.primary : theme.text.secondary,
    config: {
      duration: 150,
    },
  });
  return (
    <ButtonDiv
      style={{ ...props, userSelect: "none", ...style }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title ?? text}
    >
      <OptionText key={"button"} style={{ fontWeight: "bold", width: "100%" }}>
        {text}
      </OptionText>
      {children}
    </ButtonDiv>
  );
};

export const NameAndCountContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  align-items: center;
  user-select: text;

  & > span {
    user-select: text;
  }

  & > span:first-child {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-left: 6px;
  }

  & span {
    margin-right: 6px;
  }
`;
