import request from "../request";

export function getUserData(data) {
    return request({
        url: "/api/home/getUserData",
        method: "get",
        data,
    });
}

export function deleteUser(data) {
    return request({
        url: '/api/user/deleteUser',
        method: 'get',
        data,
    })
}

export function addUser(data) {
    return request({
        url: '/api/user/addUser',
        method: 'post',
        data,
    })
}

export function editUser(data) {
    return request({
        url: '/api/user/editUser',
        method: 'post',
        data,
    })
}

export function getMenu(params) {
    return request({
        url: '/api/permission/getMenu',
        method: 'post',
        data: params
    })
}