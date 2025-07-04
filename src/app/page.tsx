"use client";

import { useState } from "react";
import { IoChatbubbles } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";
import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";


interface Person {
  id: string;
  name: string;
}

let socket: any;

export default function ChatSystem() {
  const [openChats, setOpenChats] = useState<string[]>([]);
  const [self, setSelf] = useState<Person | null>(null);
  const [name, setName] = useState<string>("");
  const [messageMap, setMessageMap] = useState<Record<string, string[]>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [people, setPeople] = useState<Person[]>([]);

  const openChat = (id: string) => {
    if (!openChats.includes(id)) {
      setOpenChats([...openChats, id]);
    }
  };

  const joinChats = async (name: string) => {

    let baseUrl = "https://my-next-fastapi-app.vercel.app";
    if (process.env.NODE_ENV === "development") {
      baseUrl = "http://localhost:3000";
    }

    console.log(self);
    const id = uuidv4();
    setSelf({ uuid: id, name: name });

    socket = io("http://localhost:8000", {
      query: { userId: id, name: name },
    });

    socket.on("connect", () => {
      console.log("Connected with socket ID", socket.id);
    });

    socket.on("private_message", (data: { from: string; message: string }) => {
      setMessageMap((prev) => ({
        ...prev,
        [data.from]: [...(prev[data.from] || []), { "from": data.from, "msg": data.message } ],
      }));
      if (!openChats.includes(data.from)) {
        console.log(data.from);
        setOpenChats([...openChats, data.from]);
      }
    });

    socket.on("user_list", (userList: Person[]) => {
      setPeople(userList);

    });

  }

  const closeChat = (id: number) => {
    setOpenChats(openChats.filter((chatId) => chatId !== id));
  };

  return (
    <div className="p-4">
    {!self && (<div>
    <h1 className="text-xl text-center font-bold m-4"> 
    Join Chats
    </h1>
      <div className="flex justify-center mb-10">

        <input
                  type="text"
                  placeholder="My Name"
                  className="max-w-60 p-1 text-sm border m-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
        <button 
        onClick={() => joinChats(name)}
        className="bg-purple-800 text-white px-3 m-1 rounded hover:bg-purple-600 transition delay-50 duration-300">
          Join
        </button>
      </div>
      </div>)}

      {/*<div>{JSON.stringify(people)}</div>
      <div>{JSON.stringify(openChats)}</div>
      <div>{JSON.stringify(messageMap)}</div>*/}
      
      {self && (<div>
      <h1 className="text-xl text-center font-bold mb-4">People to Chat With</h1>
      
      <div className="flex justify-center">
      <table className="w-full max-w-200 border">
        <thead>
          <tr className="bg-purple-100">
            <th className="p-2 text-left border">Name</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <tr key={person.id}>
              <td className="p-2 border">{person.name}</td>
              <td className="p-2 border text-center">
                {(person.id !== self.uuid) ? (<button
                  className="bg-purple-800 text-white px-4 py-1 rounded hover:bg-purple-600 transition delay-50 duration-300"
                  onClick={() => openChat(person.id)}

                >
                  <IoChatbubbles />
                </button>) : (<p>You</p>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="fixed bottom-0 right-4 flex gap-4 p-4 justify-end z-50">
        {openChats.map((chatId) => {
          const person = people.find((p) => p.id === chatId);
          return (
            <div
              key={chatId}
              className="bg-white border w-64"
            >
              <div className="flex justify-between items-center bg-purple-200 p-2">
                <span className="font-semibold text-sm">
                  Chat with {person?.name}
                </span>
                <button
                  className="text-black-500 font-bold px-2"
                  onClick={() => closeChat(chatId)}
                >
                  <IoMdClose />
                </button>
              </div>
              <div className="p-2 h-40 text-sm overflow-y-auto">
                {(messageMap[chatId] || []).map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === chatId ? 'justify-start' : 'justify-end'}`}>
                    {msg.msg}
                  </div>
                ))}
              </div>
              <div className="border-t p-2">
                <input
                  type="text"
                  placeholder="Message here"
                  className="w-full p-1 text-sm border"
                  value={inputs[chatId] || ""}
                  disabled={!person}
                  onChange={(e) =>
                    setInputs({ ...inputs, [chatId]: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const msg = inputs[chatId];
                      if (msg.trim() && self) {
                        socket.emit("private_message", {
                          to: chatId,
                          from: self.uuid,
                          message: msg,
                        });

                        setMessageMap((prev) => ({
                          ...prev,
                          [chatId]: [...(prev[chatId] || []), { "from": self.uuid, "msg": msg } ],
                        }));

                        setInputs({ ...inputs, [chatId]: "" });
                      }
                    }}}
                />
              </div>
            </div>
          );
        })}
      </div>
      </div>)}
    </div>
  );
}

// export default async function MyNextFastAPIApp() {
//   const role = await fetchEngineerRole();

//   return (
//     <>
//       <div>{`The main skill of a ${role.title} is ${role.mainskill}.`}</div>
//     </>
//   );
// }

// async function fetchEngineerRole() {
//   const title = "Frontend Developer";
//   let baseUrl = "https://my-next-fastapi-app.vercel.app";
//   if (process.env.NODE_ENV === "development") {
//     baseUrl = "http://localhost:3000";
//   }

//   try {
//     const response = await fetch(
//       `${baseUrl}/api/py/engineer-roles?title=${title}`
//     );
//     if (!response.ok) {
//       throw new Error("Failed to fetch data");
//     }
//     const role = await response.json();
//     return role;
//   } catch (error) {
//     console.error("Error fetching engineer role:", error);
//     return null;
//   }
// }


    // try {

    //   const response = await fetch(`/api/py/get-chatters`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       uuid: id,
    //       name: name,
    //     }),
    //   });
    //   if (!response.ok) {
    //     throw new Error("Failed to fetch data");
    //   }
    //   const people_response = await response.json();
    //   console.log(people_response);
    //   return people_response;
    // } catch (error) {
    //   console.error("Error fetching people: ", error);
    //   return null;
    // }