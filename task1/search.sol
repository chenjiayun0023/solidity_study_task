// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
✅  二分查找 (Binary Search)
题目描述：在一个有序数组中查找目标值。
*/

contract searchContract {

    function search(int[] memory array, int target) public pure returns (int) {
        uint len = array.length; 
        if (len == 0) {
            return -1; // 返回 -1 表示未找到
        }

        int left = 0;
        int right = int(len) - 1;  
        while (left <= right) {
            int mid = (left + right) / 2;
            if (array[uint(mid)] == target) {
                return mid;
            } else if (array[uint(mid)] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return -1;
    }


}