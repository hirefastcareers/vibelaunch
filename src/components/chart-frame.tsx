"use client";

import { Component, type ReactNode } from "react";

type ChartFrameProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ChartFrameState = {
  failed: boolean;
};

/** Keeps a Recharts throw from replacing the whole page with Next's error overlay. */
export class ChartFrame extends Component<ChartFrameProps, ChartFrameState> {
  state: ChartFrameState = { failed: false };

  static getDerivedStateFromError(): ChartFrameState {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("[chart]", error);
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
