STATE = {
    "processes": [],   # e.g. ["P1", "P2"]
    "events": [],      # e.g. [{"id":"e1","process":"P1","timestamp":[1,0]}]
    "messages": [],
    "hb": [],  
    "co": [],       
}

NEXT_PROCESS_NUM = 1
NEXT_EVENT_NUM = 1


def reset_state():
    global NEXT_PROCESS_NUM, NEXT_EVENT_NUM
    STATE["processes"].clear()
    STATE["events"].clear()
    STATE["messages"].clear()
    STATE["hb"] = []   
    STATE["co"] = []

    NEXT_PROCESS_NUM = 1
    NEXT_EVENT_NUM = 1