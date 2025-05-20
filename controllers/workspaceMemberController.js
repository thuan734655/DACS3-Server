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

// Get all members in a workspace by workspace ID
export const getMembersByWorkspaceId = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Validate the workspaceId format
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID format",
      });
    }

    // Verify the workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // Check if the user is a member of the workspace
    const isMember = workspace.members.some(
      (member) => member.user_id.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this workspace",
      });
    }

    // Get total count of members
    const totalMembers = workspace.members.length;

    // Apply pagination to members array
    const paginatedMemberIds = workspace.members
      .slice(skip, skip + limit)
      .map(member => member.user_id);

    // Fetch full user details for each member
    const memberDetails = await User.find({ _id: { $in: paginatedMemberIds } });

    // Combine user details with role information
    const result = memberDetails.map(user => {
      const memberInfo = workspace.members.find(
        member => member.user_id.toString() === user._id.toString()
      );
      
      return {
        ...user.toObject(),
        role: memberInfo.role,
        joined_at: memberInfo.joined_at
      };
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      total: totalMembers,
      currentPage: page,
      totalPages: Math.ceil(totalMembers / limit),
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

// Search for members in a workspace
export const searchMembersInWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { searchQuery } = req.query;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID format",
      });
    }

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // Verify the workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // Check if the user is a member of the workspace
    const isMember = workspace.members.some(
      (member) => member.user_id.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this workspace",
      });
    }

    // Get all member IDs from the workspace
    const memberIds = workspace.members.map(member => member.user_id);

    // Search for users with matching name or email
    const matchingUsers = await User.find({
      _id: { $in: memberIds },
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ]
    })
    .skip(skip)
    .limit(limit);

    // Get total count for pagination
    const total = await User.countDocuments({
      _id: { $in: memberIds },
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ]
    });

    // Combine user details with role information
    const result = matchingUsers.map(user => {
      const memberInfo = workspace.members.find(
        member => member.user_id.toString() === user._id.toString()
      );
      
      return {
        ...user.toObject(),
        role: memberInfo.role,
        joined_at: memberInfo.joined_at
      };
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: result
    });
  } catch (error) {
    console.error("Error searching workspace members:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
