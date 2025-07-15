import request from "./request";


export default {
    getTableData() {
        return request({
            url: "/home/getTableData",
            method: "get",
        });
    },
    getCountData() {
        return request({
            url: "/home/getCountData",
            method: "get",
        });
    },
    getChartData() {
        return request({
            url: "/home/getChartData",
            method: "get",
        });
    },
};