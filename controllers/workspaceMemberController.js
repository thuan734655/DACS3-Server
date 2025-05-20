import User from "../models/model_database/users.js";
import Workspace from "../models/model_database/workspaces.js";
import mongoose from "mongoose";

// Get all users who share workspaces with the current user
export const getUsersInSameWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Find all workspaces where the current user is a member
    const workspaces = await Workspace.find({
      "members.user_id": userId
    });
    
    if (workspaces.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        data: []
      });
    }
    
    // Extract all unique member IDs from these workspaces
    const workspaceIds = workspaces.map(workspace => workspace._id);
    
    // Aggregate to find all users in these workspaces
    const usersInWorkspaces = await Workspace.aggregate([
      {
        $match: {
          _id: { $in: workspaceIds }
        }
      },
      {
        $unwind: "$members"
      },
      {
        $group: {
          _id: "$members.user_id",
          roles: { $addToSet: "$members.role" },
          workspaceCount: { $sum: 1 }
        }
      },
      {
        $match: {
          _id: { $ne: mongoose.Types.ObjectId(userId) } // Exclude the current user
        }
      },
      {
        $sort: { workspaceCount: -1 } // Sort by number of shared workspaces
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);
    
    // Get the total count for pagination
    const total = await Workspace.aggregate([
      {
        $match: {
          _id: { $in: workspaceIds }
        }
      },
      {
        $unwind: "$members"
      },
      {
        $group: {
          _id: "$members.user_id"
        }
      },
      {
        $match: {
          _id: { $ne: mongoose.Types.ObjectId(userId) } // Exclude the current user
        }
      },
      {
        $count: "total"
      }
    ]);
    
    const totalCount = total.length > 0 ? total[0].total : 0;
    
    // Get the full user details
    const userIds = usersInWorkspaces.map(user => user._id);
    const users = await User.find({ _id: { $in: userIds } });
    
    // Combine user details with workspace info
    const result = users.map(user => {
      const workspaceInfo = usersInWorkspaces.find(
        u => u._id.toString() === user._id.toString()
      );
      
      return {
        ...user.toObject(),
        sharedWorkspaces: workspaceInfo.workspaceCount,
        roles: workspaceInfo.roles
      };
    });
    
    return res.status(200).json({
      success: true,
      count: result.length,
      total: totalCount,
      data: result
    });
  } catch (error) {
    console.error("Error fetching workspace members:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
