import { Router } from "express";
import {
    createUser,
    getUserById,
    getUserByEmail,
    getAllUsers,
    updateUser,
    deleteUser,
    changePassword
} from "../controllers/user.controller";

const router = Router();

router.post("/users", createUser);
router.get("/users/:id", getUserById);
router.get("/users/email/:email", getUserByEmail);
router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/change-password", changePassword);

export default router;