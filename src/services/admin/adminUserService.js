import api from "../../apis/default.js";
import { createCrudService, readResponseData } from "./adminBaseService.js";

const userService = createCrudService("/admin/users");

export const adminUserService = {
    ...userService,

    async updateRole(id, role) {
        const response = await api.patch(`/admin/users/${id}/role`, { role });
        return readResponseData(response);
    },

    async lock(id) {
        const response = await api.patch(`/admin/users/${id}/lock`);
        return readResponseData(response);
    },

    async unlock(id) {
        const response = await api.patch(`/admin/users/${id}/unlock`);
        return readResponseData(response);
    }
};
