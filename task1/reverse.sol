// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
✅ 反转字符串 (Reverse String)
题目描述：反转一个字符串。输入 "abcde"，输出 "edcba"
*/

contract reverse {

    function reverseString(string memory str) public pure returns (string memory){
        bytes memory strBytes = bytes(str);
        uint len = strBytes.length;
        bytes memory reversed = new bytes(len);

        // 反转操作
        for (uint i = 0; i < len; i++) {
            reversed[i] = strBytes[len - 1 - i];
        }
        
        return string(reversed);
    }



}