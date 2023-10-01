"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

interface Params {
  userId: string;
  name: string;
  bio: string;
  path: string;
  username: string;
  image: string;
}
export async function updateUser({
  userId,
  username,
  name,
  bio,
  image,
  path,
}: Params): Promise<void> {
  connectToDB();
  try {
    await User.findOneAndUpdate(
      {
        id: userId,
      },
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      // this means it will update and insert both depends on whether the value exists or not
      { upsert: true }
    );

    //   revalidate path is a next js function which allows you to revalidate data associated with a specific path. This is useful for scenarios where you want to update your cached data without waiting for a revalidation period to expire
    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    throw new Error(`Failed to create/update user  : ${error.message}`);
  }
}

export async function fetchUser(userId: string) {
  try {
    connectToDB();

    return await User.findOne({ id: userId })
    // .populate({
    //   path : 'Communtiies',
    //   model : Community
    // });
  } catch (error : any) {
    throw new Error(`Failed to fetch user : ${error.message}`)
  }
}

