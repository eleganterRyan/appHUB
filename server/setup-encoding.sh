#!/bin/bash

# 设置中文编码环境
export LANG=zh_CN.UTF-8
export LC_ALL=zh_CN.UTF-8
export LC_CTYPE=zh_CN.UTF-8
export PYTHONIOENCODING=utf-8

# 检查编码设置
echo "当前编码设置:"
echo "LANG: $LANG"
echo "LC_ALL: $LC_ALL"
echo "LC_CTYPE: $LC_CTYPE"
echo "PYTHONIOENCODING: $PYTHONIOENCODING"

# 测试中文显示
echo "测试中文显示: 你好世界"

# 启动Node.js应用
echo "启动Node.js应用..."
node dist/index.js
