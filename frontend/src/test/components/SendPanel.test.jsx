import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SendPanel from "../../components/process/SendPanel";

describe("SendPanel", () => {
  test("renders heading, selects, and send button", () => {
    render(
      <SendPanel
        processes={["P1", "P2"]}
        onSend={vi.fn()}
        busy={false}
      />
    );

    expect(screen.getByText(/send message/i)).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  test("send button is disabled initially", () => {
    render(
      <SendPanel
        processes={["P1", "P2"]}
        onSend={vi.fn()}
        busy={false}
      />
    );

    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  test("send button stays disabled when from and to are the same", async () => {
    const user = userEvent.setup();

    render(
      <SendPanel
        processes={["P1", "P2"]}
        onSend={vi.fn()}
        busy={false}
      />
    );

    const [fromSelect, toSelect] = screen.getAllByRole("combobox");
    const sendButton = screen.getByRole("button", { name: /send/i });

    await user.selectOptions(fromSelect, "P1");
    await user.selectOptions(toSelect, "P1");

    expect(sendButton).toBeDisabled();
  });

  test("enables send button for valid different processes", async () => {
    const user = userEvent.setup();

    render(
      <SendPanel
        processes={["P1", "P2"]}
        onSend={vi.fn()}
        busy={false}
      />
    );

    const [fromSelect, toSelect] = screen.getAllByRole("combobox");
    const sendButton = screen.getByRole("button", { name: /send/i });

    await user.selectOptions(fromSelect, "P1");
    await user.selectOptions(toSelect, "P2");

    expect(sendButton).toBeEnabled();
  });

  test("calls onSend with selected processes", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    render(
      <SendPanel
        processes={["P1", "P2"]}
        onSend={onSend}
        busy={false}
      />
    );

    const [fromSelect, toSelect] = screen.getAllByRole("combobox");

    await user.selectOptions(fromSelect, "P1");
    await user.selectOptions(toSelect, "P2");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(onSend).toHaveBeenCalledWith("P1", "P2");
  });

  test("disables send button when busy", async () => {
    render(
      <SendPanel
        processes={["P1", "P2"]}
        onSend={vi.fn()}
        busy={true}
      />
    );

    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });
});