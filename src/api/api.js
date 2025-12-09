import request from "./request";

// 1. getTableData
export function getTableData() {
    return request({
        url: "/home/getTableData",
        method: "get",
    });
}

// 2. getCountData
export function getCountData() {
    return request({
        url: "/home/getCountData",
        method: "get",
    });
}

// 3. getChartData
export function getChartData() {
    return request({
        url: "/home/getChartData",
        method: "get",
    });
}

// 4. getUserData
export function getUserData(data) {
    return request({
        url: "/home/getUserData",
        method: "get",
        data,
    });
}

// 5. deleteUser
export function deleteUser(data) {
    return request({
        url: '/user/deleteUser',
        method: 'get',
        data,
    })
}

// 6. addUser
export function addUser(data) {
    return request({
        url: '/user/addUser',
        method: 'post',
        data,
    })
}

// 7. editUser
export function editUser(data) {
    return request({
        url: '/user/editUser',
        method: 'post',
        data,
    })
}

// 8. getMenu
export function getMenu(params) {
    return request({
        url: '/permission/getMenu',
        method: 'post',
        data: params
    })
}

// 9. getSpecData (这就是你报错的那个)
export function getSpecData(params) {
    return request({
        url: '/specdata/getSpecData',
        method: 'get',
        params // get请求参数一般放在 params 里
    })
}