import { useEffect, useState } from "react";
import {
  getState,
  createProcess,
  deleteProcess,
  addLocalEvent,
  deleteEvent,
  sendMessage,
} from "../api/vectorClockApi";

export function useVectorClockState() {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadState = async () => {
    setError("");
    const data = await getState();
    setState(data);
    return data;
  };

  const runAction = async (action, { reload = false } = {}) => {
    setBusy(true);
    setError("");

    try {
      const data = await action();
      if (!data.ok) throw new Error(data.error || "Something went wrong");
      if (reload) await loadState();
      return data;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadState().catch((e) => setError(String(e)));
  }, []);

  const handleAddProcess = () => runAction(createProcess, { reload: true });

  const handleDeleteProcess = (pid) =>
    runAction(() => deleteProcess(pid), { reload: true });

  const handleAddEvent = (pid) =>
    runAction(() => addLocalEvent(pid), { reload: true });

  const handleDeleteEvent = (eventId) =>
    runAction(() => deleteEvent(eventId), { reload: true });

  const handleSendMessage = (fromPid, toPid) =>
    runAction(() => sendMessage(fromPid, toPid), { reload: true });

  return {
    state,
    busy,
    error,
    loadState,
    handleAddProcess,
    handleDeleteProcess,
    handleAddEvent,
    handleDeleteEvent,
    handleSendMessage,
  };
}