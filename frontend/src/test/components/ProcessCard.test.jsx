import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProcessCard from "../../components/process/ProcessCard";

describe("ProcessCard", () => {
  test("renders header controls", () => {
    render(
      <ProcessCard
        pid="P1"
        events={[]}
        busy={false}
        onDelete={vi.fn()}
        onAddEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
      />
    );

    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByLabelText("Add event to P1")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete P1")).toBeInTheDocument();
  });

  test("expands and shows empty state when there are no events", async () => {
    const user = userEvent.setup();

    render(
      <ProcessCard
        pid="P1"
        events={[]}
        busy={false}
        onDelete={vi.fn()}
        onAddEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
      />
    );

    expect(screen.queryByText(/no events yet/i)).not.toBeInTheDocument();

    await user.click(screen.getByText("P1"));

    expect(screen.getByText(/no events yet/i)).toBeInTheDocument();
  });

  test("expands and shows events", async () => {
    const user = userEvent.setup();

    render(
      <ProcessCard
        pid="P1"
        events={[
          { id: "e1", type: "LOCAL", timestamp: [1, 0] },
          { id: "e2", type: "SEND", timestamp: [2, 0] },
        ]}
        busy={false}
        onDelete={vi.fn()}
        onAddEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
      />
    );

    await user.click(screen.getByText("P1"));

    expect(screen.getByText("e1")).toBeInTheDocument();
    expect(screen.getByText("e2")).toBeInTheDocument();
    expect(screen.getByText("LOCAL")).toBeInTheDocument();
    expect(screen.getByText("SEND")).toBeInTheDocument();
    expect(screen.getByText("ts: [1, 0]")).toBeInTheDocument();
    expect(screen.getByText("ts: [2, 0]")).toBeInTheDocument();
  });

  test("calls onAddEvent with pid", async () => {
    const user = userEvent.setup();
    const onAddEvent = vi.fn();

    render(
      <ProcessCard
        pid="P1"
        events={[]}
        busy={false}
        onDelete={vi.fn()}
        onAddEvent={onAddEvent}
        onDeleteEvent={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Add event to P1"));

    expect(onAddEvent).toHaveBeenCalledWith("P1");
  });

  test("calls onDelete with pid", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <ProcessCard
        pid="P1"
        events={[]}
        busy={false}
        onDelete={onDelete}
        onAddEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Delete P1"));

    expect(onDelete).toHaveBeenCalledWith("P1");
  });

  test("calls onDeleteEvent with event id", async () => {
    const user = userEvent.setup();
    const onDeleteEvent = vi.fn();

    render(
      <ProcessCard
        pid="P1"
        events={[{ id: "e1", type: "LOCAL", timestamp: [1, 0] }]}
        busy={false}
        onDelete={vi.fn()}
        onAddEvent={vi.fn()}
        onDeleteEvent={onDeleteEvent}
      />
    );

    await user.click(screen.getByText("P1"));

    const buttons = screen.getAllByRole("button");
    const eventDeleteButton = buttons[3];
    await user.click(eventDeleteButton);

    expect(onDeleteEvent).toHaveBeenCalledWith("e1");
  });

  test("disables add and delete buttons when busy", () => {
    render(
      <ProcessCard
        pid="P1"
        events={[]}
        busy={true}
        onDelete={vi.fn()}
        onAddEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Add event to P1")).toBeDisabled();
    expect(screen.getByLabelText("Delete P1")).toBeDisabled();
  });
});