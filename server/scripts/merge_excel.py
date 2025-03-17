#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
import os
import sys
import json
from pathlib import Path
import numpy as np

def merge_excel_files(file_paths, output_path, include_headers=True):
    """
    合并多个Excel文件为一个xlsx文件
    
    参数:
    file_paths (list): Excel文件路径列表
    output_path (str): 输出文件路径
    include_headers (bool): 是否包含表头 - True表示将所有行作为数据，False表示将第一行作为列名
    
    返回:
    bool: 成功返回True，失败返回False
    """
    try:
        print(f"DEBUG: Function called with include_headers={include_headers} (type: {type(include_headers)})", file=sys.stderr)
        
        if not file_paths:
            print("No files to merge", file=sys.stderr)
            return False
            
        # 读取所有Excel文件
        dataframes = []
        
        # 第一个文件的处理
        first_file = file_paths[0]
        if not os.path.exists(first_file):
            print(f"First file not found: {first_file}", file=sys.stderr)
            return False
            
        try:
            # 读取第一个文件
            file_ext = os.path.splitext(first_file)[1].lower()
            engine = 'xlrd' if file_ext == '.xls' else 'openpyxl'
            
            try:
                # 根据include_headers决定如何读取第一个文件
                if include_headers:
                    # 如果包含表头，将所有行作为数据读取（包括第一行）
                    print(f"DEBUG: Reading first file with all rows as data (header=None)", file=sys.stderr)
                    first_df = pd.read_excel(first_file, engine=engine, header=None)
                    # 生成默认列名
                    first_df.columns = [f"Column_{i+1}" for i in range(len(first_df.columns))]
                else:
                    # 如果不包含表头，将第一行作为列名
                    print(f"DEBUG: Reading first file with first row as header (header=0)", file=sys.stderr)
                    first_df = pd.read_excel(first_file, engine=engine, header=0)
            except Exception as e:
                print(f"Failed with {engine}, trying alternative engine: {str(e)}", file=sys.stderr)
                engine = 'openpyxl' if engine == 'xlrd' else 'xlrd'
                
                if include_headers:
                    first_df = pd.read_excel(first_file, engine=engine, header=None)
                    first_df.columns = [f"Column_{i+1}" for i in range(len(first_df.columns))]
                else:
                    first_df = pd.read_excel(first_file, engine=engine, header=0)
                
            print(f"Successfully read first file: {first_file}", file=sys.stderr)
            print(f"Rows in first file: {len(first_df)}", file=sys.stderr)
            
            # 处理空值
            first_df = first_df.replace([None, np.nan], '')
            
            # 保存列名，用于后续文件
            columns = first_df.columns.tolist()
            print(f"DEBUG: Columns for merged file: {columns}", file=sys.stderr)
            
            # 添加第一个文件到数据帧列表
            dataframes.append(first_df)
            
            # 处理后续文件
            for i, file_path in enumerate(file_paths[1:], 1):
                if not os.path.exists(file_path):
                    print(f"File not found: {file_path}", file=sys.stderr)
                    continue
                    
                try:
                    # 根据文件扩展名选择引擎
                    file_ext = os.path.splitext(file_path)[1].lower()
                    engine = 'xlrd' if file_ext == '.xls' else 'openpyxl'
                    
                    # 根据include_headers参数决定如何读取文件
                    if include_headers:
                        # 如果包含表头，将所有行作为数据读取
                        print(f"DEBUG: Reading file {i+1} with all rows as data (header=None)", file=sys.stderr)
                        try:
                            # 读取所有数据，不使用表头
                            df = pd.read_excel(file_path, engine=engine, header=None)
                            
                            # 确保列数匹配
                            if len(df.columns) != len(columns):
                                print(f"WARNING: File {i+1} has different number of columns ({len(df.columns)}) than first file ({len(columns)})", file=sys.stderr)
                                
                                # 如果列数不同，需要调整
                                if len(df.columns) > len(columns):
                                    # 如果后续文件列数更多，扩展列名
                                    new_columns = columns.copy()
                                    for j in range(len(columns), len(df.columns)):
                                        new_columns.append(f"Column_{j+1}")
                                    
                                    # 更新所有数据帧的列名
                                    for idx, prev_df in enumerate(dataframes):
                                        for j in range(len(columns), len(df.columns)):
                                            prev_df[f"Column_{j+1}"] = ''
                                    
                                    columns = new_columns
                                else:
                                    # 如果后续文件列数更少，为其添加空列
                                    for j in range(len(df.columns), len(columns)):
                                        df[columns[j]] = ''
                            
                            # 设置列名与第一个文件一致
                            df.columns = columns[:len(df.columns)]
                            
                        except Exception as e:
                            print(f"Failed with {engine}, trying alternative engine: {str(e)}", file=sys.stderr)
                            engine = 'openpyxl' if engine == 'xlrd' else 'xlrd'
                            
                            df = pd.read_excel(file_path, engine=engine, header=None)
                            
                            # 同样处理列数不匹配的情况
                            if len(df.columns) != len(columns):
                                if len(df.columns) > len(columns):
                                    new_columns = columns.copy()
                                    for j in range(len(columns), len(df.columns)):
                                        new_columns.append(f"Column_{j+1}")
                                    
                                    for idx, prev_df in enumerate(dataframes):
                                        for j in range(len(columns), len(df.columns)):
                                            prev_df[f"Column_{j+1}"] = ''
                                    
                                    columns = new_columns
                                else:
                                    for j in range(len(df.columns), len(columns)):
                                        df[columns[j]] = ''
                            
                            df.columns = columns[:len(df.columns)]
                    else:
                        # 如果不包含表头，将第一行作为列名
                        print(f"DEBUG: Reading file {i+1} with first row as header (header=0)", file=sys.stderr)
                        try:
                            df = pd.read_excel(file_path, engine=engine, header=0)
                            
                            # 确保列名一致
                            if set(df.columns) != set(columns):
                                print(f"WARNING: File {i+1} has different column names than first file", file=sys.stderr)
                                
                                # 重命名列以匹配第一个文件
                                df.columns = columns
                                
                        except Exception as e:
                            print(f"Failed with {engine}, trying alternative engine: {str(e)}", file=sys.stderr)
                            engine = 'openpyxl' if engine == 'xlrd' else 'xlrd'
                            
                            df = pd.read_excel(file_path, engine=engine, header=0)
                            df.columns = columns
                    
                    # 打印文件信息
                    print(f"Successfully read file {i+1}: {file_path}", file=sys.stderr)
                    print(f"Rows in file {i+1}: {len(df)}", file=sys.stderr)
                    print(f"First few rows of file {i+1}:", file=sys.stderr)
                    print(df.head(3).to_string(), file=sys.stderr)
                    
                    # 处理空值
                    df = df.replace([None, np.nan], '')
                    
                    # 添加到数据帧列表
                    dataframes.append(df)
                    
                except Exception as e:
                    print(f"Error processing file {i+1}: {str(e)}", file=sys.stderr)
                    continue
                    
        except Exception as e:
            print(f"Error processing first file: {str(e)}", file=sys.stderr)
            return False
        
        if len(dataframes) == 0:
            print("No valid Excel data found", file=sys.stderr)
            return False
            
        # 合并所有数据帧
        print(f"Merging {len(dataframes)} dataframes", file=sys.stderr)
        merged_df = pd.concat(dataframes, ignore_index=True)
        print(f"Merged dataframe size: {merged_df.shape}", file=sys.stderr)
        
        # 确保输出目录存在
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # 保存为xlsx格式
        merged_df.to_excel(output_path, index=False, engine='openpyxl')
        print(f"Saved merged file to: {output_path}", file=sys.stderr)
        
        return True
    except Exception as e:
        print(f"Failed to merge Excel files: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return False

if __name__ == "__main__":
    # 重定向警告到stderr
    import warnings
    warnings.filterwarnings('ignore')
    
    # 从命令行参数获取JSON数据
    if len(sys.argv) != 2:
        print("Usage: python merge_excel.py <json_data>", file=sys.stderr)
        sys.exit(1)
    
    try:
        # 解析JSON数据
        data = json.loads(sys.argv[1])
        file_paths = data.get('files', [])
        output_path = data.get('output', '')
        
        # 确保include_headers是布尔值 - 更详细的调试
        include_headers_raw = data.get('includeHeaders')
        
        # 详细打印接收到的参数
        print(f"DEBUG: Raw includeHeaders from JSON: '{include_headers_raw}' (type: {type(include_headers_raw)})", file=sys.stderr)
        
        # 处理不同类型的输入
        if isinstance(include_headers_raw, bool):
            include_headers = include_headers_raw
            print(f"DEBUG: includeHeaders is already boolean: {include_headers}", file=sys.stderr)
        elif isinstance(include_headers_raw, str):
            # 更详细地检查字符串值
            print(f"DEBUG: includeHeaders is string. Lower: '{include_headers_raw.lower()}', Equals 'true': {include_headers_raw.lower() == 'true'}", file=sys.stderr)
            include_headers = include_headers_raw.lower() == 'true'
        else:
            include_headers = True  # 默认值
            print(f"DEBUG: Using default value for includeHeaders: {include_headers}", file=sys.stderr)
            
        print(f"DEBUG: Final includeHeaders value: {include_headers} (type: {type(include_headers)})", file=sys.stderr)
        
        # 验证参数
        if not file_paths or not output_path:
            print("Missing required parameters", file=sys.stderr)
            sys.exit(1)
        
        # 打印参数信息
        print(f"Number of files: {len(file_paths)}", file=sys.stderr)
        print(f"Include headers: {include_headers}", file=sys.stderr)
        
        # 合并Excel文件
        success = merge_excel_files(file_paths, output_path, include_headers)
        
        # 返回结果 - 确保只输出JSON到stdout
        result = {
            'success': success,
            'output': output_path if success else None
        }
        
        # 只输出JSON结果到stdout
        sys.stdout.write(json.dumps(result))
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Script execution failed: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1) 