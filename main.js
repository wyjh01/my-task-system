// main.js

// 1. 引入 Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 2. 配置你的 Supabase 项目
const SUPABASE_URL = 'https://qdugzdyeioanqosrhdga.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HbvZh0CuBxiQaPuLxVd7hw_NIp4yD7n';

// 3. 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// main.js (续)

// ======================================================
// 通用逻辑：根据当前页面路径，执行不同的函数
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('index.html') || path === '/') {
        handleAuthPage();
    } else if (path.includes('dashboard.html')) {
        handleDashboardPage();
    } else if (path.includes('admin.html')) {
        handleAddminPage();
    }
});

// ======================================================
// 1. 登录/注册页面 (index.html) 的逻辑
// ======================================================
function handleAuthPage() {
    const registerForm = document.getElementById('register-form');
    // ...新的代码...
    // 如果存在注册表单，才添加事件监听 (避免在登录页报错)
    if (document.getElementById('register-form')) {
        const registerForm = document.getElementById('register-form');
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) {
                alert('注册失败: ' + error.message);
            } else {
                // 修改这里！
                alert('注册成功！请前往登录页面登录。');
                // 自动跳转到登录页
                window.location.href = 'index.html'; 
            }
        });
    }

    // 如果存在登录表单，才添加事件监听 (避免在注册页报错)
    if (document.getElementById('login-form')) {
        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', async (event) => {
            // ...登录逻辑保持不变...
            event.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                alert('登录失败: ' + error.message);
            } else {
                window.location.href = 'dashboard.html';
            }
        });
    }

    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            alert('登录失败: ' + error.message);
        } else {
            // 登录成功，跳转到任务面板
            window.location.href = 'dashboard.html';
        }
    });
}


// ======================================================
// 2. 任务面板页面 (dashboard.html) 的逻辑 (V2.0 全新升级)
// ======================================================
async function handleDashboardPage() {
    // 检查用户是否登录
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        alert('请先登录！');
        window.location.href = 'index.html';
        return;
    }

    const user = session.user;
    document.getElementById('user-email').textContent = user.email;

    // --- 核心逻辑开始 ---

    const taskListElement = document.getElementById('task-list');

    // 1. 获取所有属于该用户的任务
    const { data: tasks, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false }); // 按创建时间倒序

    if (fetchError) {
        console.error('获取任务失败', fetchError);
        taskListElement.innerHTML = '<p class="text-danger">加载任务失败，请刷新页面。</p>';
        return;
    }

    if (tasks.length === 0) {
        taskListElement.innerHTML = '<p>太棒了，当前没有任务！</p>';
        return;
    }

    // 2. 检查是否存在“已领取”但未“回填”的任务
    const hasPendingTask = tasks.some(task => task.status === '已领取');

    // 3. 遍历任务，生成 HTML 卡片
    taskListElement.innerHTML = ''; // 清空旧内容
    tasks.forEach(task => {
        const canClaim = !hasPendingTask; // 如果没有待办任务，则可以领取新任务

        // 根据任务状态决定按钮和样式
        let buttonsHTML = '';
        let cardClass = '';

        if (task.status === '未领取') {
            cardClass = 'border-primary';
            if (canClaim) {
                buttonsHTML = `
                    <button class="btn btn-primary btn-sm claim-btn" data-task-id="${task.id}">领取任务</button>
                `;
            } else {
                buttonsHTML = `
                    <button class="btn btn-secondary btn-sm" disabled>需先回填其他任务</button>
                `;
            }
        } else if (task.status === '已领取') {
            cardClass = 'border-warning';
            buttonsHTML = `
                <button class="btn btn-warning btn-sm submit-btn" data-task-id="${task.id}">回填任务</button>
            `;
        } else if (task.status === '已回填') {
            cardClass = 'border-success';
            buttonsHTML = `<p class="text-success mb-0">已于 ${new Date(task.submitted_at).toLocaleString()} 完成</p>`;
        }
        
        // 创建任务卡片 HTML
        const taskCardHTML = `
            <div class="col-md-6 col-lg-4">
                <div class="card task-card ${cardClass}">
                    <div class="card-header fw-bold">
                        ${task.title}
                    </div>
                    <div class="card-body">
                        <p class="card-text"><strong>链接:</strong> ${task.link}</p>
                        <button class="btn btn-outline-secondary btn-sm me-2 copy-btn" data-text="${task.title}">复制名称</button>
                        <button class="btn btn-outline-secondary btn-sm copy-btn" data-text="${task.link}">复制链接</button>
                    </div>
                    <div class="card-footer text-muted d-flex justify-content-between align-items-center">
                        <span>状态: ${task.status}</span>
                        <div>${buttonsHTML}</div>
                    </div>
                </div>
            </div>
        `;
        taskListElement.insertAdjacentHTML('beforeend', taskCardHTML);
    });

    // 4. 为所有新生成的按钮添加事件监听
    
    // 复制按钮
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const textToCopy = e.target.dataset.text;
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert('已复制到剪贴板！');
            }).catch(err => {
                console.error('复制失败', err);
                alert('复制失败！');
            });
        });
    });

    // 领取按钮
    document.querySelectorAll('.claim-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const taskId = e.target.dataset.taskId;
            if (confirm('确定要领取这个任务吗？')) {
                const { error } = await supabase
                    .from('tasks')
                    .update({ 
                        status: '已领取',
                        claimed_at: new Date().toISOString() 
                    })
                    .eq('id', taskId);
                
                if (error) {
                    alert('领取失败: ' + error.message);
                } else {
                    alert('领取成功！');
                    location.reload(); // 刷新页面以更新状态
                }
            }
        });
    });

    // 回填按钮
    document.querySelectorAll('.submit-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const taskId = e.target.dataset.taskId;
            const submission = prompt('请输入回填内容（例如，截图链接、文字说明等）:');
            
            if (submission !== null && submission.trim() !== '') {
                const { error } = await supabase
                    .from('tasks')
                    .update({ 
                        status: '已回填', 
                        submitted_content: submission,
                        submitted_at: new Date().toISOString() 
                    })
                    .eq('id', taskId);

                if (error) {
                    alert('回填失败: ' + error.message);
                } else {
                    alert('回填成功！感谢您的完成！');
                    location.reload(); // 刷新页面
                }
            } else if(submission !== null) {
                alert('回填内容不能为空！');
            }
        });
    });

    // 退出登录按钮
    document.getElementById('logout-button').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
}


// ======================================================
// 3. 管理员页面 (admin.html) 的逻辑
// ======================================================
function handleAddminPage() {
    const addTaskForm = document.getElementById('add-task-form');
    addTaskForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const title = document.getElementById('task-title').value;
        const link = document.getElementById('task-link').value;
        const userId = document.getElementById('user-id').value; // 这里手动输入用户的ID

        const { data, error } = await supabase
            .from('tasks')
            .insert([{ title: title, link: link, user_id: userId }]);
        
        const messageEl = document.getElementById('admin-message');
        if (error) {
            messageEl.textContent = '发布失败: ' + error.message;
            messageEl.style.color = 'red';
        } else {
            messageEl.textContent = '任务发布成功！';
            messageEl.style.color = 'green';
            addTaskForm.reset();
        }
    });
}