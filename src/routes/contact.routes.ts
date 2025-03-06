import { Router } from "express";
import {
    createContact,
    getContactById,
    getAllContacts,
    updateContact,
    deleteContact,
    createContactGroup,
    getContactGroupById,
    getAllContactGroups,
    updateContactGroup,
    deleteContactGroup,
    addContactToGroup,
    removeContactFromGroup
} from "../controllers/contact.controller";

const router = Router();

// Rutas para contactos
router.post("/contacts", createContact);
router.get("/contacts/:id", getContactById);
router.get("/contacts", getAllContacts);
router.put("/contacts/:id", updateContact);
router.delete("/contacts/:id", deleteContact);

// Rutas para grupos de contactos
router.post("/contact-groups", createContactGroup);
router.get("/contact-groups/:id", getContactGroupById);
router.get("/contact-groups", getAllContactGroups);
router.put("/contact-groups/:id", updateContactGroup);
router.delete("/contact-groups/:id", deleteContactGroup);

// Rutas para miembros de grupos de contactos
router.post("/contact-groups/add", addContactToGroup);
router.post("/contact-groups/remove", removeContactFromGroup);

export default router;