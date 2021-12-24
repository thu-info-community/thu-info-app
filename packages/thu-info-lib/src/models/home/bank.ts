export interface BankPayment {
    department: string;     // 代发部门
    project: string;        // 代发项目
    usage: string;          // 代发用途
    description: string;    // 代发说明
    bank: string;           // 开户银行
    time: string;           // 计税时间
    total: string;          // 应发金额
    deduction: string;      // 扣税金额
    actual: string;         // 实发金额
    deposit: string;        // 存折金额
    cash: string;           // 现金金额
}

export interface BankPaymentByMonth {
    month: string;
    payment: BankPayment[];
}
