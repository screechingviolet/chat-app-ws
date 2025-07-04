from fastapi import FastAPI
import json
# from pydantic import BaseModel
import socketio
from fastapi.middleware.cors import CORSMiddleware

people = []

sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="asgi")

app = FastAPI(docs_url="/api/py/docs")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app_socket = socketio.ASGIApp(sio, other_asgi_app=app)
user_id_to_sid = {}
sid_to_user_id = {}
users = {}

@sio.event
async def connect(sid, environ):
    query = environ.get("QUERY_STRING", "")
    user_id = None
    for q in query.split("&"):
        if q.startswith("userId="):
            user_id = q.split("=")[1]
        if q.startswith("name="):
            name = q.split("=")[1]
    if user_id:
        users[user_id] = {"sid": sid, "name": name}
        user_id_to_sid[user_id] = sid
        sid_to_user_id[sid] = user_id
        print(f"{user_id} connected with SID {sid}")
        await broadcast_user_list()

@sio.event
async def disconnect(sid):
    user_id = sid_to_user_id.get(sid)
    if user_id:
        print(f"{user_id} disconnected")
        users.pop(user_id, None)
        sid_to_user_id.pop(sid, None)
        user_id_to_sid.pop(user_id, None)
        await broadcast_user_list()

async def broadcast_user_list():
    people = [{"id": uid, "name": data["name"]} for uid, data in users.items()]
    await sio.emit("user_list", people)

@sio.event
async def private_message(sid, data):
    to = data.get("to")
    message = data.get("message")
    sender = data.get("from")

    print(f"Message from {sender} to {to}: {message}")
    if to in user_id_to_sid:
        await sio.emit("private_message", {"from": sender, "message": message}, to=user_id_to_sid[to])



# class ChatterRequest(BaseModel):
#     uuid: str
#     name: str

# @app.post("/api/py/get-chatters")
# async def get_chatters(data: ChatterRequest):
#     people.append(data)
#     return people