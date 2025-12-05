<script setup>



</script>

<template>
    <div class="footer-container">
        <span>Copyright &copy; 2025 - {{ new Date().getFullYear() }} 东北大学·流程工业综合自动化国家重点实验室 All Rights Reserved.</span>
    </div>
</template>

<style lang="less" scoped>
.footer-container {
    height: 100%;
    // background: #fff;
    // border-top: 1px solid #E5E6EB;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;

    span {
        user-select: none;
        cursor: text;
        user-select: text;
    }
}
</style>
