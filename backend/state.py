STATE = {
    "co":[
        {"event1":"e1","event2":"e2"},
        {"event1":"e2","event2":"e3"},
        {"event1":"e6","event2":"e7"}],
    "events":[
        {"id":"e1","process":"P1","timestamp":[1,0],"type":"LOCAL"},
        {"id":"e2","process":"P2","timestamp":[0,1],"type":"LOCAL"},
        {"id":"e3","message_id":"m1","process":"P1","timestamp":[2,0],"type":"SEND"},
        {"id":"e4","message_id":"m1","process":"P2","timestamp":[2,2],"type":"RECEIVE"},
        {"id":"e5","message_id":"m2","process":"P2","timestamp":[2,3],"type":"SEND"},
        {"id":"e6","message_id":"m2","process":"P1","timestamp":[3,3],"type":"RECEIVE"},
        {"id":"e7","process":"P2","timestamp":[2,4],"type":"LOCAL"}],
    "hb":[{"from":"e1","to":"e3"},
          {"from":"e1","to":"e4"},
          {"from":"e1","to":"e5"},
          {"from":"e1","to":"e6"},
          {"from":"e1","to":"e7"},
          {"from":"e2","to":"e4"},
          {"from":"e2","to":"e5"},
          {"from":"e2","to":"e6"},
          {"from":"e2","to":"e7"},
          {"from":"e3","to":"e4"},
          {"from":"e3","to":"e5"},
          {"from":"e3","to":"e6"},
          {"from":"e3","to":"e7"},
          {"from":"e4","to":"e5"},
          {"from":"e4","to":"e6"},
          {"from":"e4","to":"e7"},
          {"from":"e5","to":"e6"},
          {"from":"e5","to":"e7"}],
    "messages":[
        {"from":"P1","id":"m1","to":"P2"},
        {"from":"P2","id":"m2","to":"P1"}],
    "processes":["P1","P2"]}      



NEXT_PROCESS_NUM = 3
NEXT_EVENT_NUM = 8


def reset_state():
    global NEXT_PROCESS_NUM, NEXT_EVENT_NUM
    STATE["processes"].clear()
    STATE["events"].clear()
    STATE["messages"].clear()
    STATE["hb"] = []   
    STATE["co"] = []

    NEXT_PROCESS_NUM = 1
    NEXT_EVENT_NUM = 1