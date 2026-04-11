import { render, screen } from "@testing-library/react";
import ProcessGrid from "../../components/process/ProcessGrid";

describe("ProcessGrid", () => {
  test("renders one card per process", () => {
    render(
      <ProcessGrid
        processes={["P1", "P2"]}
        events={[]}
        busy={false}
        onDelete={vi.fn()}
        onAddEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
        onAddProcess={vi.fn()}
        onSendMessage={vi.fn()}
      />
    );

    // Check process-specific controls exist
    expect(screen.getByLabelText("Add event to P1")).toBeInTheDocument();
    expect(screen.getByLabelText("Add event to P2")).toBeInTheDocument();

    expect(screen.getByLabelText("Delete P1")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete P2")).toBeInTheDocument();
  });

  test("renders process actions panel", () => {
    render(
      <ProcessGrid
        processes={["P1"]}
        events={[]}
        busy={false}
        onDelete={vi.fn()}
        onAddEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
        onAddProcess={vi.fn()}
        onSendMessage={vi.fn()}
      />
    );

    // Check global controls exist
    expect(
      screen.getByRole("button", { name: /\+ add process/i })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/send message/i)
    ).toBeInTheDocument();
  });

  test("disables actions when busy", () => {
    render(
      <ProcessGrid
        processes={["P1"]}
        events={[]}
        busy={true}
        onDelete={vi.fn()}
        onAddEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
        onAddProcess={vi.fn()}
        onSendMessage={vi.fn()}
      />
    );

    // Add process button should be disabled
    expect(
      screen.getByRole("button", { name: /\+ add process/i })
    ).toBeDisabled();

    // Add event button should also be disabled
    expect(screen.getByLabelText("Add event to P1")).toBeDisabled();
  });
});