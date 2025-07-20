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
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
            alert('注册失败: ' + error.message);
        } else {
            alert('注册成功！请检查你的邮箱以完成验证，然后登录。');
            // 注册成功后，Supabase会给用户发一封验证邮件。
        }
    });

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
// 2. 任务面板页面 (dashboard.html) 的逻辑
// ======================================================
async function handleDashboardPage() {
    // 检查用户是否登录
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert('请先登录！');
        window.location.href = 'index.html';
        return;
    }

    // 显示用户信息
    const user = session.user;
    document.getElementById('user-email').textContent = user.email;
    
    // 加载任务列表
    const taskList = document.getElementById('task-list');
    const { data: tasks, error } = await supabase.from('tasks').select('*');
    
    if (error) {
        console.error('获取任务失败', error);
    } else {
        if (tasks.length === 0) {
            taskList.innerHTML = '<li>暂无任务</li>';
        } else {
            tasks.forEach(task => {
                const li = document.createElement('li');
                li.textContent = `任务名: ${task.title} - 链接: ${task.link}`;
                taskList.appendChild(li);
            });
        }
    }
    
    // 退出登录
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