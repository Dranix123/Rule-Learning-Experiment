import pandas as pd
import matplotlib.pyplot as plt
import io
import os

# --- 0. 准备工作 ---
# --- 0. Setup ---

# 创建一个文件夹来保存生成的图片
# Create a directory to save the output images
output_dir = 'trial_plots_absolute_scale'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# --- 1. 数据加载与准备 ---
# --- 1. Load and Prepare Data ---

# 定义数据文件路径 (您的修改已保留)
# Define the path to the data file (Your change is preserved)
file_path = 'example_data.csv'

# 完整读取文件所有行
# Read all lines from the file
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
except FileNotFoundError:
    print(f"错误：找不到文件 {file_path}。请确保数据文件与脚本在同一目录下。")
    exit()

# --- 2. 解析实验试次（Trials）和鼠标数据 ---
# --- 2. Parse Experiment Trials and Mouse Data ---

try:
    # 为了适应不同的换行符（Windows/Mac/Linux），先去除每行的首尾空白
    # To handle different line endings (Windows/Mac/Linux), strip whitespace from each line
    stripped_lines = [line.strip() for line in lines]

    # 找到各个数据块的边界
    # Find the boundaries of different data blocks
    trials_marker_index = stripped_lines.index('# EXPERIMENT 1 TRIALS')
    # 您的修改已保留
    # Your change is preserved
    mouse_marker_index = stripped_lines.index('# MOUSE TRAJECTORY')
    
    # 提取试次数据
    # Extract trial data
    trials_lines = lines[trials_marker_index + 1 : mouse_marker_index]
    trials_lines = [line for line in trials_lines if line.strip()]
    trials_csv_string = "".join(trials_lines)
    trials_df = pd.read_csv(io.StringIO(trials_csv_string))
    trials_df.columns = trials_df.columns.str.strip()

    # 提取鼠标轨迹数据
    # Extract mouse tracking data
    mouse_data_lines = lines[mouse_marker_index + 2:]
    mouse_csv_string = "".join(mouse_data_lines)
    mouse_df = pd.read_csv(io.StringIO(mouse_csv_string), header=None, names=['x', 'y', 'time'])

except ValueError as e:
    print(f"错误：无法在文件中找到必要的数据标记。请检查文件格式。原始错误: {e}")
    exit()

# --- 3. 数据清理 ---
# --- 3. Data Cleaning ---

# 清理鼠标数据
# Clean mouse data
mouse_df['x'] = pd.to_numeric(mouse_df['x'], errors='coerce')
mouse_df['y'] = pd.to_numeric(mouse_df['y'], errors='coerce')
mouse_df['time'] = pd.to_numeric(mouse_df['time'], errors='coerce')
mouse_df.dropna(inplace=True)

# 清理试次数据
# Clean trial data
trials_df['start_time'] = pd.to_numeric(trials_df['start_time'], errors='coerce')
trials_df['rt'] = pd.to_numeric(trials_df['rt'], errors='coerce')
trials_df.dropna(subset=['start_time', 'rt'], inplace=True)

print(f"成功加载 {len(trials_df)} 个试次和 {len(mouse_df)} 个鼠标数据点。")


# --- 4. 为每个试次生成统一坐标轴的轨迹图 ---
# --- 4. Generate Trajectory Plot for Each Trial with Unified Axes ---

for index, trial in trials_df.iterrows():
    trial_index = int(trial['trial_index'])
    start_time = trial['start_time']
    end_time = start_time + trial['rt']
    
    trial_mouse_data = mouse_df[(mouse_df['time'] >= start_time) & (mouse_df['time'] <= end_time)].copy()
    
    if trial_mouse_data.empty:
        print(f"试次 {trial_index}: 在时间范围内未找到鼠标数据，已跳过。")
        continue

    # 计算相对时间用于着色
    # Calculate relative time for coloring
    trial_mouse_data['relative_time'] = trial_mouse_data['time'] - start_time
    
    # --- 开始绘图 ---
    # --- Start Plotting ---
    plt.figure(figsize=(10, 8))
    
    # 使用原始坐标绘图
    # Plot using the original coordinates
    scatter = plt.scatter(
        trial_mouse_data['x'], 
        trial_mouse_data['y'], 
        c=trial_mouse_data['relative_time'], 
        cmap='viridis', 
        s=15, 
        alpha=0.7
    )
    
    cbar = plt.colorbar(scatter)
    cbar.set_label('time since the stimulus is presented (ms)')
    
    # 标记起点和终点
    # Mark the start and end points using their original coordinates
    plt.plot(trial_mouse_data['x'].iloc[0], trial_mouse_data['y'].iloc[0], 'go', markersize=10, label='Start')
    plt.plot(trial_mouse_data['x'].iloc[-1], trial_mouse_data['y'].iloc[-1], 'ro', markersize=10, label='End')
    
    # --- 设置图表属性 ---
    # --- Set Chart Properties ---
    # 【已按您的要求修改】直接设置固定的坐标轴范围
    # [MODIFIED AS PER YOUR REQUEST] Directly set the fixed axis limits
    plt.xlim(0, 1500)
    plt.ylim(100, 1000)
    
    plt.title(f'Mouse Trajectory of Trial {trial_index} ( stimulus: {trial["stimulus"]}, choice: {trial["choice"]} )')
    plt.xlabel('X Coordinate')
    plt.ylabel('Y Coordinate')
    plt.legend()
    plt.grid(True)

    # 【关键修改】替换 plt.axis('equal')
    # [CRITICAL CHANGE] Replace plt.axis('equal')
    # 使用 'box' 调整方式来保持坐标比例，同时严格遵守 xlim 和 ylim
    # Use 'box' adjustment to maintain aspect ratio while strictly adhering to xlim and ylim
    plt.gca().set_aspect('equal', adjustable='box')
    
    plt.gca().invert_yaxis() # 反转Y轴以符合屏幕坐标习惯（Y向下为正）

    # 保存图表到文件
    # Save the plot to a file
    output_filename = os.path.join(output_dir, f'trial_{trial_index}.png')
    plt.savefig(output_filename)
    plt.close()
    
    print(f"已生成试次 {trial_index} 的轨迹图，并保存至 {output_filename}")

print(f"\n处理完成！所有轨迹图已保存到 '{output_dir}' 文件夹中。")

