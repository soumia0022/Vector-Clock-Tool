import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App";

import { useVectorClockState } from "../../src/hooks/useVectorClockState";
import { usePlayback } from "../../src/hooks/usePlayback";
import { useTheoryQuiz } from "../../src/hooks/useTheoryQuiz";
import { useDiagramQuiz } from "../../src/hooks/useDiagramQuiz";

vi.mock("../../src/hooks/useVectorClockState", () => ({
  useVectorClockState: vi.fn(),
}));

vi.mock("../../src/hooks/usePlayback", () => ({
  usePlayback: vi.fn(),
}));

vi.mock("../../src/hooks/useTheoryQuiz", () => ({
  useTheoryQuiz: vi.fn(),
}));

vi.mock("../../src/hooks/useDiagramQuiz", () => ({
  useDiagramQuiz: vi.fn(),
}));

vi.mock("../../src/utils/eventExplanation", () => ({
  getEventExplanation: vi.fn(() => "Mock explanation"),
}));

vi.mock("../../src/utils/hbChains", () => ({
  buildHbChains: vi.fn(() => []),
}));

vi.mock("../../src/utils/concurrentGroups", () => ({
  buildConcurrentGroups: vi.fn(() => []),
}));

vi.mock("../../src/components/layout/Toolbar", () => ({
  default: ({ busy, canGenerateDiagramQuiz }) => (
    <div>
      Toolbar busy:{String(busy)} canDiagram:{String(canGenerateDiagramQuiz)}
    </div>
  ),
}));

vi.mock("../../src/components/layout/AnalysisPanel", () => ({
  default: () => <div>AnalysisPanel</div>,
}));

vi.mock("../../src/components/layout/DebugPanel", () => ({
  default: () => <div>DebugPanel</div>,
}));

vi.mock("../../src/components/playback/PlaybackPanel", () => ({
  default: () => <div>PlaybackPanel</div>,
}));

vi.mock("../../src/components/quiz/TheoryQuizCard", () => ({
  default: () => <div>TheoryQuizCard</div>,
}));

vi.mock("../../src/components/quiz/DiagramQuizCard", () => ({
  default: () => <div>DiagramQuizCard</div>,
}));

vi.mock("../../src/components/process/ProcessGrid", () => ({
  default: () => <div>ProcessGrid</div>,
}));

vi.mock("../../src/components/diagram/LamportDiagram", () => ({
  default: () => <div>LamportDiagram</div>,
}));

vi.mock("../../src/components/ai/AiPanel", () => ({
  default: () => <div>AiPanel</div>,
}));

function mockHooks({
  state = {
    processes: ["P1", "P2"],
    events: [],
    hb: [],
    co: [],
  },
  stateBusy = false,
  stateError = "",
  theoryBusy = false,
  diagramBusy = false,
} = {}) {
  useVectorClockState.mockReturnValue({
    state,
    busy: stateBusy,
    error: stateError,
    handleAddProcess: vi.fn(),
    handleDeleteProcess: vi.fn(),
    handleAddEvent: vi.fn(),
    handleDeleteEvent: vi.fn(),
    handleSendMessage: vi.fn(),
  });

  usePlayback.mockReturnValue({
    isPlaying: false,
    playIndex: 0,
    speedMultiplier: 1,
    progressPercent: 0,
    setIsPlaying: vi.fn(),
    setSpeedMultiplier: vi.fn(),
    reset: vi.fn(),
    stepBack: vi.fn(),
    stepForward: vi.fn(),
    jumpToIndex: vi.fn(),
  });

  useTheoryQuiz.mockReturnValue({
    busy: theoryBusy,
    quizQuestion: null,
    quizResult: null,
    generateQuiz: vi.fn(),
    checkAnswer: vi.fn(),
    closeQuiz: vi.fn(),
    aiExplanation: "",
    aiLoading: false,
    askAIExplanation: vi.fn(),
  });

  useDiagramQuiz.mockReturnValue({
    busy: diagramBusy,
    diagramQuizQuestion: null,
    diagramQuizResult: null,
    generateQuiz: vi.fn(),
    checkAnswer: vi.fn(),
    closeQuiz: vi.fn(),
    aiExplanation: "",
    aiLoading: false,
    askAIExplanation: vi.fn(),
  });
}

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHooks();
  });

  test("renders heading and subheading", () => {
    render(<App />);

    expect(screen.getByText("Vector Clock Tool")).toBeInTheDocument();
    expect(
      screen.getByText(/build distributed event diagrams, explore causality/i)
    ).toBeInTheDocument();
  });

  test("shows welcome modal initially", () => {
    render(<App />);

    expect(
      screen.getByText("Welcome to the Vector Clock Tool")
    ).toBeInTheDocument();

    expect(screen.getByText(/build event diagrams/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /get started/i })
    ).toBeInTheDocument();
  });

  test("closes welcome modal when get started is clicked", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /get started/i }));

    expect(
      screen.queryByText("Welcome to the Vector Clock Tool")
    ).not.toBeInTheDocument();
  });

  test("shows error box when state hook returns an error", () => {
    mockHooks({ stateError: "Something went wrong" });

    render(<App />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  test("renders main panels when state exists", () => {
    render(<App />);

    expect(screen.getByText("AnalysisPanel")).toBeInTheDocument();
    expect(screen.getByText("LamportDiagram")).toBeInTheDocument();
    expect(screen.getByText("ProcessGrid")).toBeInTheDocument();
    expect(screen.getByText("AiPanel")).toBeInTheDocument();
  });

  test("does not render main grid when state is null", () => {
    mockHooks({ state: null });

    render(<App />);

    expect(screen.queryByText("AnalysisPanel")).not.toBeInTheDocument();
    expect(screen.queryByText("LamportDiagram")).not.toBeInTheDocument();
    expect(screen.queryByText("ProcessGrid")).not.toBeInTheDocument();
  });

  test("passes correct diagram quiz availability to toolbar", () => {
    mockHooks({
      state: {
        processes: ["P1"],
        events: [{ id: "e1" }, { id: "e2" }],
        hb: [],
        co: [],
      },
    });

    render(<App />);

    expect(
      screen.getByText(/Toolbar busy:false canDiagram:true/)
    ).toBeInTheDocument();
  });

  test("combined busy becomes true when a quiz hook is busy", () => {
    mockHooks({ theoryBusy: true });

    render(<App />);

    expect(
      screen.getByText(/Toolbar busy:true/)
    ).toBeInTheDocument();
  });
});