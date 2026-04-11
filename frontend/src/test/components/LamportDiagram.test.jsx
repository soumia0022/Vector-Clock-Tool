import { render, screen } from "@testing-library/react";
import LamportDiagram from "../../components/diagram/LamportDiagram";

describe("LamportDiagram", () => {
  test("renders svg, legend, and tip", () => {
    const { container } = render(
      <LamportDiagram
        processes={["P1", "P2"]}
        events={[]}
      />
    );

    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("Local")).toBeInTheDocument();
    expect(screen.getByText("Send")).toBeInTheDocument();
    expect(screen.getByText("Receive")).toBeInTheDocument();
    expect(
      screen.getByText(/tip: drag to pan/i)
    ).toBeInTheDocument();
  });

  test("renders process labels", () => {
    render(
      <LamportDiagram
        processes={["P1", "P2", "P3"]}
        events={[]}
      />
    );

    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("P2")).toBeInTheDocument();
    expect(screen.getByText("P3")).toBeInTheDocument();
  });

  test("renders event labels", () => {
    render(
      <LamportDiagram
        processes={["P1", "P2"]}
        events={[
          { id: "e1", process: "P1", type: "LOCAL", timestamp: [1, 0] },
          { id: "e2", process: "P2", type: "SEND", timestamp: [0, 1] },
        ]}
      />
    );

    expect(screen.getByText("e1")).toBeInTheDocument();
    expect(screen.getByText("e2")).toBeInTheDocument();
  });

  test("renders active happens-before chain event labels", () => {
    render(
      <LamportDiagram
        processes={["P1", "P2"]}
        events={[
          { id: "e1", process: "P1", type: "LOCAL", timestamp: [1, 0] },
          { id: "e2", process: "P1", type: "SEND", timestamp: [2, 0], message_id: "m1" },
          { id: "e3", process: "P2", type: "RECEIVE", timestamp: [2, 1], message_id: "m1" },
        ]}
        activeHbChain={["e1", "e2", "e3"]}
      />
    );

    expect(screen.getByText("e1")).toBeInTheDocument();
    expect(screen.getByText("e2")).toBeInTheDocument();
    expect(screen.getByText("e3")).toBeInTheDocument();
  });

  test("renders with concurrent group props", () => {
    render(
      <LamportDiagram
        processes={["P1", "P2"]}
        events={[
          { id: "e1", process: "P1", type: "LOCAL", timestamp: [1, 0] },
          { id: "e2", process: "P2", type: "LOCAL", timestamp: [0, 1] },
        ]}
        activeConcurrentGroup={{
          events: ["e1"],
          others: ["e2"],
        }}
      />
    );

    expect(screen.getByText("e1")).toBeInTheDocument();
    expect(screen.getByText("e2")).toBeInTheDocument();
  });
});