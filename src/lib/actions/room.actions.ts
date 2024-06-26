"use server";

import { tursoClient } from "../db";
import { redirect } from "next/navigation";
import { pollSchema, roomSchema, usernameSchema } from "../schemas";
import { v4 as uuidv4 } from "uuid";
import { PARTYKIT_URL } from "../env";
import { createSession } from "../session";

const createNewUser = async (username: string) => {
  const newUser = await tursoClient.execute({
    sql: "INSERT INTO users (username) VALUES (?)",
    args: [username],
  });

  return Number(newUser.lastInsertRowid);
};

export const authenticateUser = async (
  initialState: any,
  formData: FormData,
) => {
  const validatedFields = usernameSchema.safeParse({
    username: formData.get("username"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const existingUser = await tursoClient.execute({
    sql: "SELECT * FROM users WHERE username = ?",
    args: [validatedFields.data.username],
  });
  const isCreatingRoom = initialState.roomId === "create";

  if (isCreatingRoom && existingUser.rows.length) {
    return {
      errors: {
        username: ["username is already taken"],
      },
    };
  }

  const userId = existingUser.rows.length
    ? Number(existingUser.rows[0].id)
    : await createNewUser(validatedFields.data.username);

  await createSession(userId.toString());

  if (isCreatingRoom) {
    const roomId = uuidv4();
    await createRoom(roomId, userId);
    redirect(`/room/${roomId}`);
  } else {
    redirect(`/room/${initialState.roomId}`);
  }
};

const createRoom = async (roomId: string, userId: number) =>
  await tursoClient.execute({
    sql: "INSERT INTO rooms (id, created_by) VALUES (?, ?)",
    args: [roomId, userId],
  });

export const joinRoom = async (_: unknown, formData: FormData) => {
  const validatedFields = await roomSchema.safeParseAsync({
    "room-code": formData.get("room-code"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  redirect(`/auth?room=${validatedFields.data["room-code"]}`);
};

export const createPoll = async (_: unknown, formData: FormData) => {
  const options: string[] = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("option-")) {
      options.push(value.toString());
    }
  }

  const validatedFields = pollSchema.safeParse({
    title: formData.get("title"),
    options,
    duration: Number(formData.get("duration")),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const id = uuidv4();
  const poll = {
    title: validatedFields.data.title,
    options: validatedFields.data.options,
    duration: validatedFields.data.duration,
  };
  await fetch(`${PARTYKIT_URL}/party/${id}`, {
    method: "POST",
    body: JSON.stringify(poll),
    headers: {
      "Content-Type": "application/json",
    },
  });

  redirect(`/poll/${id}`);
};
