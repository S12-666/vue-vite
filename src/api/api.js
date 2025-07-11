import request from "./request";


export default {
    getTableData() {
        return request({
            url: "api/home/getTableData",
            method: "get"
        });
    },
};