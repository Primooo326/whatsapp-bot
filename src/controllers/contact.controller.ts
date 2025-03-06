import { Request, Response } from "express";
import pool from "../config/database";
import { ContactService } from "@/services/contact.service";
import ContactGroupService from "@/services/contactGroup.service";

const contactService = new ContactService(pool);
const contactGroupService = new ContactGroupService(pool);

export const createContact = async (req: Request, res: Response): Promise<void> => {
    const { name, channelId } = req.body;

    if (!name || !channelId) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const newContact = await contactService.createContact(name, channelId);
        res.status(201).json({ message: "Contacto creado exitosamente", contact: newContact });
    } catch (error) {
        console.error("Error al crear el contacto:", error);
        res.status(500).json({ message: "Error al crear el contacto" });
    }
};

export const getContactById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const contact = await contactService.getContactById(id);
        if (!contact) {
            res.status(404).json({ message: "Contacto no encontrado" });
            return;
        }
        res.json(contact);
    } catch (error) {
        console.error("Error al obtener el contacto:", error);
        res.status(500).json({ message: "Error al obtener el contacto" });
    }
};

export const getAllContacts = async (req: Request, res: Response): Promise<void> => {
    try {
        const contacts = await contactService.getAllContacts();
        res.json(contacts);
    } catch (error) {
        console.error("Error al obtener los contactos:", error);
        res.status(500).json({ message: "Error al obtener los contactos" });
    }
};

export const updateContact = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, channelId } = req.body;

    if (!name || !channelId) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const updatedContact = await contactService.updateContact(id, name, channelId);
        if (!updatedContact) {
            res.status(404).json({ message: "Contacto no encontrado" });
            return;
        }
        res.json({ message: "Contacto actualizado exitosamente", contact: updatedContact });
    } catch (error) {
        console.error("Error al actualizar el contacto:", error);
        res.status(500).json({ message: "Error al actualizar el contacto" });
    }
};

export const deleteContact = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        await contactService.deleteContact(id);
        res.json({ message: "Contacto eliminado exitosamente" });
    } catch (error) {
        console.error("Error al eliminar el contacto:", error);
        res.status(500).json({ message: "Error al eliminar el contacto" });
    }
};

export const createContactGroup = async (req: Request, res: Response): Promise<void> => {
    const { botId, name, description } = req.body;

    if (!botId || !name) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const newContactGroup = await contactGroupService.createContactGroup(botId, name, description);
        res.status(201).json({ message: "Grupo de contacto creado exitosamente", contactGroup: newContactGroup });
    } catch (error) {
        console.error("Error al crear el grupo de contacto:", error);
        res.status(500).json({ message: "Error al crear el grupo de contacto" });
    }
};

export const getContactGroupById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const contactGroup = await contactGroupService.getContactGroupById(id);
        if (!contactGroup) {
            res.status(404).json({ message: "Grupo de contacto no encontrado" });
            return;
        }
        res.json(contactGroup);
    } catch (error) {
        console.error("Error al obtener el grupo de contacto:", error);
        res.status(500).json({ message: "Error al obtener el grupo de contacto" });
    }
};

export const getAllContactGroups = async (req: Request, res: Response): Promise<void> => {
    try {
        const contactGroups = await contactGroupService.getAllContactGroups();
        res.json(contactGroups);
    } catch (error) {
        console.error("Error al obtener los grupos de contacto:", error);
        res.status(500).json({ message: "Error al obtener los grupos de contacto" });
    }
};

export const updateContactGroup = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const updatedContactGroup = await contactGroupService.updateContactGroup(id, name, description);
        if (!updatedContactGroup) {
            res.status(404).json({ message: "Grupo de contacto no encontrado" });
            return;
        }
        res.json({ message: "Grupo de contacto actualizado exitosamente", contactGroup: updatedContactGroup });
    } catch (error) {
        console.error("Error al actualizar el grupo de contacto:", error);
        res.status(500).json({ message: "Error al actualizar el grupo de contacto" });
    }
};

export const deleteContactGroup = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        await contactGroupService.deleteContactGroup(id);
        res.json({ message: "Grupo de contacto eliminado exitosamente" });
    } catch (error) {
        console.error("Error al eliminar el grupo de contacto:", error);
        res.status(500).json({ message: "Error al eliminar el grupo de contacto" });
    }
};

export const addContactToGroup = async (req: Request, res: Response): Promise<void> => {
    const { groupId, contactId } = req.body;

    if (!groupId || !contactId) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const contactGroupMember = await contactGroupService.addContactToGroup(groupId, contactId);
        res.status(201).json({ message: "Contacto añadido al grupo exitosamente", contactGroupMember });
    } catch (error) {
        console.error("Error al añadir el contacto al grupo:", error);
        res.status(500).json({ message: "Error al añadir el contacto al grupo" });
    }
};

export const removeContactFromGroup = async (req: Request, res: Response): Promise<void> => {
    const { groupId, contactId } = req.body;

    if (!groupId || !contactId) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        await contactGroupService.removeContactFromGroup(groupId, contactId);
        res.json({ message: "Contacto eliminado del grupo exitosamente" });
    } catch (error) {
        console.error("Error al eliminar el contacto del grupo:", error);
        res.status(500).json({ message: "Error al eliminar el contacto del grupo" });
    }
};