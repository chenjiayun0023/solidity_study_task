// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
罗马数字转整数
https://leetcode.cn/problems/roman-to-integer/description/
*/

contract romanToIntContract {
    // 罗马字符到数值的映射
    mapping(bytes1 => uint) private romanValues;
    
    // 特殊组合的映射
    mapping(bytes1 => mapping(bytes1 => bool)) private specialCases;
    
    constructor() {
        // 初始化基本罗马数字值
        romanValues['I'] = 1;
        romanValues['V'] = 5;
        romanValues['X'] = 10;
        romanValues['L'] = 50;
        romanValues['C'] = 100;
        romanValues['D'] = 500;
        romanValues['M'] = 1000;
        
        // 初始化特殊组合（需要减法的组合）
        specialCases['I']['V'] = true; // IV = 4
        specialCases['I']['X'] = true; // IX = 9
        specialCases['X']['L'] = true; // XL = 40
        specialCases['X']['C'] = true; // XC = 90
        specialCases['C']['D'] = true; // CD = 400
        specialCases['C']['M'] = true; // CM = 900
    }
    
    function romanToInt(string memory s) public view returns (uint) {
        bytes memory romanBytes = bytes(s);
        uint length = romanBytes.length;
        uint result = 0;
        
        for (uint i = 0; i < length; i++) {
            bytes1 currentChar = romanBytes[i];
            uint currentValue = romanValues[currentChar];
            
            // 检查是否是特殊组合（当前字符 + 下一个字符）
            if (i + 1 < length) {
                bytes1 nextChar = romanBytes[i + 1];
                
                // 如果是特殊组合，需要减法
                if (specialCases[currentChar][nextChar]) {
                    result += romanValues[nextChar] - currentValue;
                    i++; // 跳过下一个字符，因为已经处理了
                    continue;
                }
            }
            
            // 普通情况，直接相加
            result += currentValue;
        }
        
        return result;
    }
    
    // 验证罗马数字是否有效
    function isValidRoman(string memory s) public pure returns (bool) {
        bytes memory strBytes = bytes(s);
        
        if (strBytes.length == 0) {
            return false;
        }
        
        // 检查是否只包含有效的罗马字符
        for (uint i = 0; i < strBytes.length; i++) {
            bytes1 char = strBytes[i];
            if (!(char == 'I' || char == 'V' || char == 'X' || 
                  char == 'L' || char == 'C' || char == 'D' || char == 'M')) {
                return false;
            }
        }
        
        return true;
    }
    
    
}