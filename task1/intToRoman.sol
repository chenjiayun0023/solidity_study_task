// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
整数转罗马数字
https://leetcode.cn/problems/integer-to-roman/description/
*/

contract intToRomanContract {
    // 定义罗马数字符号和对应的值（从大到小排序）
    struct RomanSymbol {
        uint value;
        string symbol;
    }
    
    RomanSymbol[] private symbols;
    
    constructor() {
        // 初始化符号表，按照值从大到小排序
        symbols.push(RomanSymbol(1000, "M"));
        symbols.push(RomanSymbol(900, "CM"));
        symbols.push(RomanSymbol(500, "D"));
        symbols.push(RomanSymbol(400, "CD"));
        symbols.push(RomanSymbol(100, "C"));
        symbols.push(RomanSymbol(90, "XC"));
        symbols.push(RomanSymbol(50, "L"));
        symbols.push(RomanSymbol(40, "XL"));
        symbols.push(RomanSymbol(10, "X"));
        symbols.push(RomanSymbol(9, "IX"));
        symbols.push(RomanSymbol(5, "V"));
        symbols.push(RomanSymbol(4, "IV"));
        symbols.push(RomanSymbol(1, "I"));
    }
    
    function intToRoman(uint num) public view returns (string memory) {
        require(num > 0 && num < 5000, "Number must be between 1 and 4999");
        
        bytes memory result;
        uint remaining = num;
        
        // 从最大的符号开始处理
        for (uint i = 0; i < symbols.length; i++) {
            RomanSymbol memory symbol = symbols[i];
            
            // 当剩余值大于等于当前符号值时，添加该符号
            while (remaining >= symbol.value) {
                bytes memory symbolBytes = bytes(symbol.symbol);
                
                // 将符号追加到结果中
                for (uint j = 0; j < symbolBytes.length; j++) {
                    // 由于 Solidity 字符串操作的限制，我们需要手动构建字节数组
                    result = abi.encodePacked(result, symbolBytes[j]);
                }
                
                remaining -= symbol.value;
            }
            
            if (remaining == 0) break;
        }
        
        return string(result);
    }
    
    
    
}