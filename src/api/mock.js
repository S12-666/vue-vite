import Mock from 'mockjs';
import homeApi from "../api/mockData/home.js"
// 拦截的路径 拦截的方法 制造出的假数据
Mock.mock(/api\/home\/getTableData/, 'get', homeApi.getTableData);
