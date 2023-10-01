"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Thread from "../models/thread.model";
import { FilterQuery, SortOrder } from "mongoose";

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

    return await User.findOne({ id: userId });
    // .populate({
    //   path : 'Communtiies',
    //   model : Community
    // });
  } catch (error: any) {
    throw new Error(`Failed to fetch user : ${error.message}`);
  }
}

export async function fetchUserPosts(userId: string) {
  try {
    connectToDB();

    // find all threads authored by the user
    // TOOD : populate community
    const threads = await User.findOne({ id: userId }).populate({
      path: "threads",
      model: Thread,
      populate: {
        path: "children",
        model: Thread,
        populate: {
          path: "author",
          model: User,
          select: "name image id ",
        },
      },
    });
    return threads
  } catch (err) {
    console.log(err);
    throw new Error("Failed to return threads")
  }
}

export async function fetchUsers({
  userId ,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy  = "desc"
} : {
  userId : string ,
  searchString?:string ,
  pageNumber ?:number ,
  pageSize ?: number,
  sortBy ?: SortOrder
}) {
  try{
    connectToDB()
    const skipAmount = (pageNumber - 1) * pageSize
    const regex = new RegExp(searchString , 'i')

    const query : FilterQuery<typeof User> = {
      id : {$ne : userId}
    }
    if(searchString.trim() !== ''){
      query.$or = [
        {username : {$regex : regex}},
        {name : {$regex : regex}}
      ]
    }

    const sortOptions = {createdAt : sortBy}
    const usersQuery = User.find({query})
    .sort(sortOptions)
    .skip(skipAmount)
    .limit(pageSize)

    const totalUsersCount = await User.countDocuments(query)

    const users = await usersQuery.exec()
    const isNext  = totalUsersCount > skipAmount + users.length

    return {users , isNext}
  }
  catch(err){
    console.log(err)
    throw new Error(`Failed to fetch all users`)
  }
}

export async function getActivity(userId: string) {
  try {
    connectToDB();

    // Find all threads created by the user
    const userThreads = await Thread.find({ author: userId });

    // Collect all the child thread ids (replies) from the 'children' field of each user thread
    const childThreadIds = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.children);
    }, []);

    // Find and return the child threads (replies) excluding the ones created by the same user
    const replies = await Thread.find({
      _id: { $in: childThreadIds },
      author: { $ne: userId }, // Exclude threads authored by the same user
    }).populate({
      path: "author",
      model: User,
      select: "name image _id",
    });

    return replies;
  } catch (error) {
    console.error("Error fetching replies: ", error);
    throw error;
  }
}