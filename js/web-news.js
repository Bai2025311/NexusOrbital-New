/**
 * NexusOrbital 网页端新闻动态功�? * 版本: 2025.03.23
 * 作�? 星际人居技术设计团�? */

// 全局变量
let currentCategory = 'all';
let currentSort = 'newest';
let currentPage = 1;
let newsPerPage = 6;

document.addEventListener('DOMContentLoaded', function() {
    // 检查当前页�?    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'news.html') {
        // 新闻列表�?        loadNews();
        setupNewsFilters();
        loadFeaturedNews();
        initNewsSubscribe();
    } else if (currentPage === 'news-detail.html') {
        // 新闻详情�?        loadNewsDetail();
        loadRelatedNews();
    } else if (currentPage === 'index.html' || currentPage === '') {
        // 首页
        loadLatestNews();
    }
    
    // 处理图片错误
    handleImageErrors();
});

/**
 * 设置新闻筛选功�? */
function setupNewsFilters() {
    // 获取筛选按�?    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // 添加筛选按钮点击事�?    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的active�?            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // 添加当前按钮的active�?            this.classList.add('active');
            
            // 获取筛选类�?            currentCategory = this.dataset.category;
            
            // 重置页码
            currentPage = 1;
            
            // 重新加载新闻
            loadNews();
        });
    });
    
    // 获取排序下拉�?    const sortSelect = document.getElementById('sortNews');
    
    // 添加排序下拉框变化事�?    sortSelect.addEventListener('change', function() {
        // 获取排序方式
        currentSort = this.value;
        
        // 重置页码
        currentPage = 1;
        
        // 重新加载新闻
        loadNews();
    });
    
    // 添加分页按钮点击事件
    const prevBtn = document.querySelector('.pagination-btn.prev');
    const nextBtn = document.querySelector('.pagination-btn.next');
    
    prevBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadNews();
        }
    });
    
    nextBtn.addEventListener('click', function() {
        const newsData = getNewsData();
        const filteredNews = filterNews(newsData);
        const totalPages = Math.ceil(filteredNews.length / newsPerPage);
        
        if (currentPage < totalPages) {
            currentPage++;
            loadNews();
        }
    });
}

/**
 * 加载新闻列表
 */
function loadNews() {
    // 获取新闻数据
    const newsData = getNewsData();
    
    // 筛选新�?    const filteredNews = filterNews(newsData);
    
    // 排序新闻
    const sortedNews = sortNews(filteredNews);
    
    // 分页
    const paginatedNews = paginateNews(sortedNews);
    
    // 获取新闻列表容器
    const newsGrid = document.getElementById('newsGrid');
    
    // 清空新闻列表
    newsGrid.innerHTML = '';
    
    // 检查是否有新闻
    if (paginatedNews.length === 0) {
        newsGrid.innerHTML = '<div class="no-news">暂无相关新闻</div>';
        return;
    }
    
    // 添加新闻到列�?    paginatedNews.forEach(news => {
        const newsElement = createNewsElement(news);
        newsGrid.appendChild(newsElement);
    });
    
    // 更新分页
    updatePagination(filteredNews.length);
}

/**
 * 筛选新�? * @param {Array} newsData - 新闻数据
 * @returns {Array} - 筛选后的新�? */
function filterNews(newsData) {
    // 如果选择全部，返回所有新�?    if (currentCategory === 'all') {
        return newsData;
    }
    
    // 筛选指定类别的新闻
    return newsData.filter(news => news.tag === currentCategory);
}

/**
 * 排序新闻
 * @param {Array} newsData - 新闻数据
 * @returns {Array} - 排序后的新闻
 */
function sortNews(newsData) {
    // 复制数组，避免修改原数组
    const sortedNews = [...newsData];
    
    // 根据排序方式排序
    switch (currentSort) {
        case 'newest':
            // 按日期降序排序（最新的在前�?            sortedNews.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            // 按日期升序排序（最早的在前�?            sortedNews.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'popular':
            // 按阅读量降序排序（最热门的在前）
            sortedNews.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
    }
    
    return sortedNews;
}

/**
 * 分页新闻
 * @param {Array} newsData - 新闻数据
 * @returns {Array} - 当前页的新闻
 */
function paginateNews(newsData) {
    // 计算起始索引和结束索�?    const startIndex = (currentPage - 1) * newsPerPage;
    const endIndex = startIndex + newsPerPage;
    
    // 返回当前页的新闻
    return newsData.slice(startIndex, endIndex);
}

/**
 * 更新分页
 * @param {number} totalItems - 总新闻数
 */
function updatePagination(totalItems) {
    // 计算总页�?    const totalPages = Math.ceil(totalItems / newsPerPage);
    
    // 获取分页元素
    const prevBtn = document.querySelector('.pagination-btn.prev');
    const nextBtn = document.querySelector('.pagination-btn.next');
    const paginationNumbers = document.querySelector('.pagination-numbers');
    
    // 更新上一页按钮状�?    if (currentPage === 1) {
        prevBtn.disabled = true;
    } else {
        prevBtn.disabled = false;
    }
    
    // 更新下一页按钮状�?    if (currentPage === totalPages || totalPages === 0) {
        nextBtn.disabled = true;
    } else {
        nextBtn.disabled = false;
    }
    
    // 更新页码
    paginationNumbers.innerHTML = '';
    
    // 计算显示的页码范�?    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // 调整起始页码，确保显�?个页码（如果有足够的页）
    if (endPage - startPage < 4 && totalPages > 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // 添加页码按钮
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-number';
        pageBtn.textContent = i;
        
        // 设置当前页的样式
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        
        // 添加页码按钮点击事件
        pageBtn.addEventListener('click', function() {
            currentPage = i;
            loadNews();
        });
        
        paginationNumbers.appendChild(pageBtn);
    }
    
    // 添加省略�?    if (startPage > 1) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        paginationNumbers.insertBefore(ellipsis, paginationNumbers.firstChild);
        
        // 添加第一页按�?        const firstPageBtn = document.createElement('button');
        firstPageBtn.className = 'pagination-number';
        firstPageBtn.textContent = 1;
        firstPageBtn.addEventListener('click', function() {
            currentPage = 1;
            loadNews();
        });
        paginationNumbers.insertBefore(firstPageBtn, paginationNumbers.firstChild);
    }
    
    if (endPage < totalPages) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        paginationNumbers.appendChild(ellipsis);
        
        // 添加最后一页按�?        const lastPageBtn = document.createElement('button');
        lastPageBtn.className = 'pagination-number';
        lastPageBtn.textContent = totalPages;
        lastPageBtn.addEventListener('click', function() {
            currentPage = totalPages;
            loadNews();
        });
        paginationNumbers.appendChild(lastPageBtn);
    }
    
    // 更新分页信息
    const paginationInfo = document.querySelector('.pagination-info');
    if (paginationInfo) {
        paginationInfo.textContent = `�?${currentPage} 页，�?${totalPages} 页，总计 ${totalItems} 条新闻`;
    }
}

/**
 * 加载新闻详情
 */
function loadNewsDetail() {
    // 获取新闻ID
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');
    
    if (!newsId) {
        window.location.href = 'news.html';
        return;
    }
    
    // 获取新闻数据
    const newsData = getNewsData();
    const news = newsData.find(item => item.id == newsId);
    
    if (!news) {
        window.location.href = 'news.html';
        return;
    }
    
    // 更新页面标题
    document.title = `${news.title} - NexusOrbital`;
    
    // 更新新闻详情
    document.getElementById('newsCategory').textContent = news.tag;
    document.getElementById('newsDate').textContent = formatDate(news.date);
    document.getElementById('newsTitle').textContent = news.title;
    document.getElementById('newsImage').src = news.image;
    document.getElementById('newsImage').alt = news.title;
    
    // 更新作者信�?    if (news.author) {
        document.getElementById('authorName').textContent = news.author.name;
        if (news.author.avatar) {
            document.getElementById('authorAvatar').querySelector('img').src = news.author.avatar;
        }
    }
    
    // 更新新闻内容
    document.getElementById('newsContent').innerHTML = news.content;
    
    // 加载评论
    loadNewsComments(newsId);
    
    // 初始化分享功�?    initNewsShareFeature();
    
    // 增加阅读次数
    incrementNewsViews(newsId);
}

/**
 * 增加新闻阅读次数
 * @param {string} newsId - 新闻ID
 */
function incrementNewsViews(newsId) {
    // 获取新闻数据
    const newsData = getNewsData();
    const newsIndex = newsData.findIndex(item => item.id == newsId);
    
    if (newsIndex === -1) return;
    
    // 增加阅读次数
    newsData[newsIndex].views = (newsData[newsIndex].views || 0) + 1;
    
    // 保存到本地存�?    localStorage.setItem('newsData', JSON.stringify(newsData));
}

/**
 * 初始化新闻分享功�? */
function initNewsShareFeature() {
    // 获取当前页面URL
    const currentUrl = window.location.href;
    
    // 获取新闻标题
    const newsTitle = document.getElementById('newsTitle').textContent;
    
    // 微信分享
    document.getElementById('shareWeixin').addEventListener('click', function(e) {
        e.preventDefault();
        alert('请使用微信扫一扫分�?);
    });
    
    // 微博分享
    document.getElementById('shareWeibo').addEventListener('click', function(e) {
        e.preventDefault();
        const url = encodeURIComponent(currentUrl);
        const title = encodeURIComponent(newsTitle);
        window.open(`http://service.weibo.com/share/share.php?url=${url}&title=${title}`, '_blank');
    });
    
    // QQ分享
    document.getElementById('shareQQ').addEventListener('click', function(e) {
        e.preventDefault();
        const url = encodeURIComponent(currentUrl);
        const title = encodeURIComponent(newsTitle);
        window.open(`http://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`, '_blank');
    });
    
    // LinkedIn分享
    document.getElementById('shareLinkedin').addEventListener('click', function(e) {
        e.preventDefault();
        const url = encodeURIComponent(currentUrl);
        const title = encodeURIComponent(newsTitle);
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`, '_blank');
    });
    
    // 复制链接
    document.getElementById('copyLinkBtn').addEventListener('click', function() {
        // 创建临时输入�?        const tempInput = document.createElement('input');
        tempInput.value = currentUrl;
        document.body.appendChild(tempInput);
        
        // 选择并复�?        tempInput.select();
        document.execCommand('copy');
        
        // 移除临时输入�?        document.body.removeChild(tempInput);
        
        // 显示提示
        alert('链接已复制到剪贴�?);
    });
}

/**
 * 加载新闻评论
 * @param {string} newsId - 新闻ID
 */
function loadNewsComments(newsId) {
    // 获取评论列表容器
    const commentsList = document.getElementById('commentsList');
    
    // 获取评论数量显示元素
    const commentCount = document.getElementById('commentCount');
    
    // 获取评论数据
    const comments = getNewsComments(newsId);
    
    // 更新评论数量
    commentCount.textContent = comments.length;
    
    // 清空评论列表
    commentsList.innerHTML = '';
    
    // 检查是否有评论
    if (comments.length === 0) {
        commentsList.innerHTML = '<div class="no-comments">暂无评论，成为第一个评论的人吧�?/div>';
        return;
    }
    
    // 添加评论到列�?    comments.forEach(comment => {
        const commentElement = createCommentElement(comment);
        commentsList.appendChild(commentElement);
    });
    
    // 显示加载更多按钮（如果评论数量超�?0条）
    const loadMoreBtn = document.getElementById('loadMoreComments');
    if (comments.length > 10) {
        loadMoreBtn.style.display = 'block';
    } else {
        loadMoreBtn.style.display = 'none';
    }
    
    // 检查用户登录状�?    checkCommentFormStatus();
}

/**
 * 创建评论元素
 * @param {Object} comment - 评论数据
 * @returns {HTMLElement} - 评论元素
 */
function createCommentElement(comment) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item';
    commentElement.dataset.id = comment.id;
    
    // 构建评论HTML
    commentElement.innerHTML = `
        <div class="comment-avatar">
            <img src="${comment.userAvatar || 'images/avatars/default.jpg'}" alt="${comment.username}">
        </div>
        <div class="comment-content">
            <div class="comment-header">
                <h4 class="comment-username">${comment.username}</h4>
                <span class="comment-date">${formatDate(comment.timestamp)}</span>
            </div>
            <div class="comment-text">${comment.content}</div>
            <div class="comment-actions">
                <button class="comment-like-btn" data-id="${comment.id}">
                    <i class="far fa-thumbs-up"></i> 
                    <span class="like-count">${comment.likes ? comment.likes.length : 0}</span>
                </button>
                <button class="comment-reply-btn" data-id="${comment.id}">
                    <i class="far fa-comment"></i> 回复
                </button>
            </div>
        </div>
    `;
    
    // 添加点赞按钮点击事件
    const likeBtn = commentElement.querySelector('.comment-like-btn');
    likeBtn.addEventListener('click', function() {
        toggleCommentLike(comment.id);
    });
    
    // 添加回复按钮点击事件
    const replyBtn = commentElement.querySelector('.comment-reply-btn');
    replyBtn.addEventListener('click', function() {
        showReplyForm(comment.id);
    });
    
    return commentElement;
}

/**
 * 检查评论表单状�? */
function checkCommentFormStatus() {
    // 获取当前用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    // 获取评论表单和登录提�?    const commentForm = document.getElementById('commentForm');
    const loginReminder = document.getElementById('loginReminder');
    const userAvatar = document.getElementById('userCommentAvatar');
    
    if (currentUser) {
        // 用户已登�?        commentForm.style.display = 'flex';
        loginReminder.style.display = 'none';
        
        // 设置用户头像
        if (currentUser.avatar) {
            userAvatar.src = currentUser.avatar;
        }
        
        // 添加评论提交事件
        commentForm.onsubmit = function(e) {
            e.preventDefault();
            submitNewsComment();
        };
    } else {
        // 用户未登�?        commentForm.style.display = 'none';
        loginReminder.style.display = 'block';
    }
}

/**
 * 提交新闻评论
 */
function submitNewsComment() {
    // 获取当前用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser) {
        alert('请先登录后再评论');
        return;
    }
    
    // 获取评论内容
    const commentContent = document.getElementById('commentContent').value.trim();
    
    if (!commentContent) {
        alert('评论内容不能为空');
        return;
    }
    
    // 获取新闻ID
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');
    
    if (!newsId) return;
    
    // 创建新评�?    const newComment = {
        id: Date.now().toString(),
        newsId: newsId,
        userId: currentUser.id,
        username: currentUser.username,
        userAvatar: currentUser.avatar || 'images/avatars/default.jpg',
        content: commentContent,
        timestamp: new Date().toISOString(),
        likes: []
    };
    
    // 获取评论数据
    let newsComments = JSON.parse(localStorage.getItem('newsComments') || '[]');
    
    // 添加新评�?    newsComments.push(newComment);
    
    // 保存到本地存�?    localStorage.setItem('newsComments', JSON.stringify(newsComments));
    
    // 清空评论输入�?    document.getElementById('commentContent').value = '';
    
    // 重新加载评论
    loadNewsComments(newsId);
    
    // 显示提示
    alert('评论发表成功');
}

/**
 * 切换评论点赞状�? * @param {string} commentId - 评论ID
 */
function toggleCommentLike(commentId) {
    // 获取当前用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser) {
        alert('请先登录后再点赞');
        return;
    }
    
    // 获取评论数据
    let newsComments = JSON.parse(localStorage.getItem('newsComments') || '[]');
    
    // 查找评论
    const commentIndex = newsComments.findIndex(comment => comment.id === commentId);
    
    if (commentIndex === -1) return;
    
    // 初始化likes数组（如果不存在�?    if (!newsComments[commentIndex].likes) {
        newsComments[commentIndex].likes = [];
    }
    
    // 检查用户是否已点赞
    const likeIndex = newsComments[commentIndex].likes.indexOf(currentUser.id);
    
    if (likeIndex === -1) {
        // 用户未点赞，添加点赞
        newsComments[commentIndex].likes.push(currentUser.id);
    } else {
        // 用户已点赞，取消点赞
        newsComments[commentIndex].likes.splice(likeIndex, 1);
    }
    
    // 保存到本地存�?    localStorage.setItem('newsComments', JSON.stringify(newsComments));
    
    // 更新UI
    const likeCount = document.querySelector(`.comment-item[data-id="${commentId}"] .like-count`);
    likeCount.textContent = newsComments[commentIndex].likes.length;
    
    // 更新点赞图标
    const likeIcon = document.querySelector(`.comment-item[data-id="${commentId}"] .comment-like-btn i`);
    if (newsComments[commentIndex].likes.includes(currentUser.id)) {
        likeIcon.className = 'fas fa-thumbs-up';
    } else {
        likeIcon.className = 'far fa-thumbs-up';
    }
}

/**
 * 显示回复表单
 * @param {string} commentId - 评论ID
 */
function showReplyForm(commentId) {
    // 获取当前用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser) {
        alert('请先登录后再回复');
        return;
    }
    
    // 移除所有已存在的回复表�?    const existingForms = document.querySelectorAll('.reply-form');
    existingForms.forEach(form => form.remove());
    
    // 创建回复表单
    const replyForm = document.createElement('div');
    replyForm.className = 'reply-form';
    replyForm.innerHTML = `
        <div class="comment-avatar">
            <img src="${currentUser.avatar || 'images/avatars/default.jpg'}" alt="${currentUser.username}">
        </div>
        <div class="comment-input">
            <textarea id="replyContent" placeholder="回复评论..." required></textarea>
            <div class="reply-actions">
                <button type="button" class="btn btn-outline cancel-reply-btn">取消</button>
                <button type="button" class="btn btn-primary submit-reply-btn">回复</button>
            </div>
        </div>
    `;
    
    // 添加回复表单到评论下�?    const commentElement = document.querySelector(`.comment-item[data-id="${commentId}"]`);
    commentElement.appendChild(replyForm);
    
    // 添加取消按钮点击事件
    const cancelBtn = replyForm.querySelector('.cancel-reply-btn');
    cancelBtn.addEventListener('click', function() {
        replyForm.remove();
    });
    
    // 添加提交按钮点击事件
    const submitBtn = replyForm.querySelector('.submit-reply-btn');
    submitBtn.addEventListener('click', function() {
        submitReply(commentId);
    });
    
    // 聚焦到回复输入框
    replyForm.querySelector('#replyContent').focus();
}

/**
 * 提交回复
 * @param {string} commentId - 评论ID
 */
function submitReply(commentId) {
    // 获取当前用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser) return;
    
    // 获取回复内容
    const replyContent = document.getElementById('replyContent').value.trim();
    
    if (!replyContent) {
        alert('回复内容不能为空');
        return;
    }
    
    // 获取新闻ID
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');
    
    if (!newsId) return;
    
    // 创建新回�?    const newReply = {
        id: Date.now().toString(),
        newsId: newsId,
        parentId: commentId,
        userId: currentUser.id,
        username: currentUser.username,
        userAvatar: currentUser.avatar || 'images/avatars/default.jpg',
        content: replyContent,
        timestamp: new Date().toISOString(),
        likes: []
    };
    
    // 获取评论数据
    let newsComments = JSON.parse(localStorage.getItem('newsComments') || '[]');
    
    // 添加新回�?    newsComments.push(newReply);
    
    // 保存到本地存�?    localStorage.setItem('newsComments', JSON.stringify(newsComments));
    
    // 重新加载评论
    loadNewsComments(newsId);
    
    // 显示提示
    alert('回复发表成功');
}

/**
 * 获取新闻评论
 * @param {string} newsId - 新闻ID
 * @returns {Array} - 评论数组
 */
function getNewsComments(newsId) {
    // 获取评论数据
    const newsComments = JSON.parse(localStorage.getItem('newsComments') || '[]');
    
    // 筛选当前新闻的评论
    const filteredComments = newsComments.filter(comment => comment.newsId === newsId && !comment.parentId);
    
    // 按时间排序（最新的在前�?    return filteredComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * 初始化新闻订阅功�? */
function initNewsSubscribe() {
    // 获取订阅表单
    const subscribeForm = document.getElementById('newsSubscribeForm');
    
    if (!subscribeForm) return;
    
    // 添加表单提交事件
    subscribeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 获取邮箱
        const email = document.getElementById('subscribeEmail').value.trim();
        
        if (!email) {
            showSubscribeMessage('请输入有效的邮箱地址', 'error');
            return;
        }
        
        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showSubscribeMessage('请输入有效的邮箱地址', 'error');
            return;
        }
        
        // 获取订阅列表
        let subscribers = JSON.parse(localStorage.getItem('newsSubscribers') || '[]');
        
        // 检查是否已订阅
        if (subscribers.includes(email)) {
            showSubscribeMessage('您已经订阅了我们的新闻动�?, 'info');
            return;
        }
        
        // 添加到订阅列�?        subscribers.push(email);
        
        // 保存到本地存�?        localStorage.setItem('newsSubscribers', JSON.stringify(subscribers));
        
        // 清空输入�?        document.getElementById('subscribeEmail').value = '';
        
        // 显示成功消息
        showSubscribeMessage('订阅成功！感谢您的关�?, 'success');
    });
}

/**
 * 显示订阅消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型（success, error, info�? */
function showSubscribeMessage(message, type) {
    // 获取消息显示元素
    const messageElement = document.getElementById('subscribeMessage');
    
    if (!messageElement) return;
    
    // 设置消息内容和类�?    messageElement.textContent = message;
    messageElement.className = `subscribe-message ${type}`;
    
    // 显示消息
    messageElement.style.display = 'block';
    
    // 3秒后隐藏消息
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 3000);
}

/**
 * 格式化日�? * @param {string} dateString - 日期字符�? * @returns {string} - 格式化后的日�? */
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}�?{date.getMonth() + 1}�?{date.getDate()}日`;
}

/**
 * 加载相关新闻
 */
function loadRelatedNews() {
    // 获取新闻ID
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');
    
    if (!newsId) return;
    
    // 获取新闻数据
    const newsData = getNewsData();
    
    // 查找当前新闻
    const currentNews = newsData.find(item => item.id == newsId);
    
    if (!currentNews) return;
    
    // 筛选相关新闻（同类别，排除当前新闻�?    let relatedNews = newsData.filter(item => item.tag === currentNews.tag && item.id != currentNews.id);
    
    // 如果相关新闻不足3个，添加其他新闻
    if (relatedNews.length < 3) {
        const otherNews = newsData.filter(item => item.id != currentNews.id && !relatedNews.includes(item));
        relatedNews = relatedNews.concat(otherNews.slice(0, 3 - relatedNews.length));
    }
    
    // 只取�?�?    relatedNews = relatedNews.slice(0, 3);
    
    // 获取相关新闻容器
    const relatedNewsGrid = document.getElementById('relatedNews');
    if (!relatedNewsGrid || relatedNews.length === 0) return;
    
    // 清空容器
    relatedNewsGrid.innerHTML = '';
    
    // 填充相关新闻
    relatedNews.forEach(news => {
        const newsCard = createNewsCard(news, true);
        relatedNewsGrid.appendChild(newsCard);
    });
}

/**
 * 加载首页最新新�? */
function loadLatestNews() {
    // 获取新闻数据
    const newsData = getNewsData();
    
    // 按日期排�?    const latestNews = [...newsData].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    
    // 获取新闻容器
    const newsContainer = document.querySelector('.latest-news-container');
    if (!newsContainer || latestNews.length === 0) return;
    
    // 清空容器
    newsContainer.innerHTML = '';
    
    // 填充最新新�?    latestNews.forEach(news => {
        const newsCard = createNewsElement(news);
        newsContainer.appendChild(newsCard);
    });
}

/**
 * 创建新闻卡片
 * @param {Object} news - 新闻数据
 * @param {boolean} isSimple - 是否为简化版卡片
 * @returns {HTMLElement} - 新闻卡片元素
 */
function createNewsCard(news, isSimple = false) {
    // 创建卡片容器
    const card = document.createElement('div');
    card.className = news.featured && !isSimple ? 'news-card featured-news' : 'news-card';
    card.setAttribute('data-id', news.id);
    
    // 格式化日�?    const dateObj = new Date(news.date);
    const formattedDate = `${dateObj.getFullYear()}�?{dateObj.getMonth() + 1}�?{dateObj.getDate()}日`;
    
    // 设置卡片内容
    if (isSimple) {
        // 简化版卡片（用于相关新闻）
        card.innerHTML = `
            <div class="news-image" style="background-image: url('${news.image}')">
                <div class="news-date">${formattedDate}</div>
            </div>
            <div class="news-content">
                <div class="news-tag">${news.tag}</div>
                <h3 class="news-title">${news.title}</h3>
                <a href="news-detail.html?id=${news.id}" class="news-read-more">
                    阅读全文 <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `;
    } else {
        // 完整版卡�?        card.innerHTML = `
            <div class="news-image" style="background-image: url('${news.image}')">
                <div class="news-date">${formattedDate}</div>
            </div>
            <div class="news-content">
                <div class="news-tag">${news.tag}</div>
                <h3 class="news-title">${news.title}</h3>
                <p class="news-excerpt">${news.excerpt}</p>
                <div class="news-meta">
                    <div class="news-author">
                        <div class="author-avatar" style="background-image: url('${news.author.avatar}')"></div>
                        <div class="author-name">${news.author.name}</div>
                    </div>
                    <a href="news-detail.html?id=${news.id}" class="news-read-more">
                        阅读全文 <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
    }
    
    // 添加点击事件
    card.addEventListener('click', function(e) {
        // 如果点击的是链接，不触发卡片点击事件
        if (e.target.closest('.news-read-more')) {
            return;
        }
        
        // 跳转到新闻详情页
        window.location.href = `news-detail.html?id=${news.id}`;
    });
    
    return card;
}

/**
 * 获取新闻数据
 * @returns {Array} - 新闻数据数组
 */
function getNewsData() {
    // 这里应该从服务器获取新闻数据
    // 由于没有实际的服务器，这里模拟一些数�?    return [
        {
            id: 1,
            title: "NexusOrbital与国际空间站合作项目启动",
            excerpt: "我们很荣幸地宣布，NexusOrbital已与国际空间站签署合作协议，共同开发下一代太空居住模块。该项目将结合我们的设计理念与ISS的工程经验�?,
            image: "images/news/iss-collaboration.jpg",
            date: "2025-03-15",
            author: {
                name: "张天�?,
                avatar: "images/team/zhang.jpg"
            },
            tag: "合作项目",
            featured: true,
            popularity: 95
        },
        {
            id: 2,
            title: "月球基地原型在沙漠测试成�?,
            excerpt: "我们的月球基地居住舱原型已在戈壁沙漠完成为期30天的封闭测试，模拟系统运行稳定，参与者反馈积极。这标志着项目进入下一阶段�?,
            image: "images/news/lunar-test.jpg",
            date: "2025-03-10",
            author: {
                name: "李星�?,
                avatar: "images/team/li.jpg"
            },
            tag: "技术突�?,
            featured: false,
            popularity: 87
        },
        {
            id: 3,
            title: "太空农业系统收获首批蔬菜",
            excerpt: "我们的太空农业系统在模拟太空环境中成功收获了首批蔬菜，包括生菜、菠菜和萝卜。这些作物在受控环境中生长，无需阳光和土壤�?,
            image: "images/news/space-agriculture.jpg",
            date: "2025-03-05",
            author: {
                name: "王宇�?,
                avatar: "images/team/wang.jpg"
            },
            tag: "研究进展",
            featured: false,
            popularity: 78
        },
        {
            id: 4,
            title: "NexusOrbital完成A轮融�?,
            excerpt: "我们很高兴地宣布，NexusOrbital已完�?000万美元A轮融资，由太空创投基金领投。这笔资金将用于加速平台开发和技术研究�?,
            image: "images/news/funding.jpg",
            date: "2025-02-28",
            author: {
                name: "陈明�?,
                avatar: "images/team/chen.jpg"
            },
            tag: "平台公告",
            featured: true,
            popularity: 92
        },
        {
            id: 5,
            title: "太空3D打印技术取得突破性进�?,
            excerpt: "我们的工程师团队成功开发出一种新型太�?D打印技术，可以利用月球表面的材料直接打印建筑结构，大幅降低建造成本�?,
            image: "images/news/3d-printing.jpg",
            date: "2025-02-20",
            author: {
                name: "赵工",
                avatar: "images/team/zhao.jpg"
            },
            tag: "技术突�?,
            featured: false,
            popularity: 85
        },
        {
            id: 6,
            title: "首届太空居住技术峰会圆满结�?,
            excerpt: "由NexusOrbital主办的首届太空居住技术峰会在北京成功举办，来自全球的300多名专家学者参与了为期三天的研讨�?,
            image: "images/news/summit.jpg",
            date: "2025-02-15",
            author: {
                name: "林教�?,
                avatar: "images/team/lin.jpg"
            },
            tag: "平台公告",
            featured: false,
            popularity: 76
        },
        {
            id: 7,
            title: "与航天科技集团签署战略合作协议",
            excerpt: "NexusOrbital与航天科技集团达成战略合作，双方将在太空居住技术研发、人才培养和项目孵化等方面展开深入合作�?,
            image: "images/news/partnership.jpg",
            date: "2025-02-08",
            author: {
                name: "张天�?,
                avatar: "images/team/zhang.jpg"
            },
            tag: "合作项目",
            featured: false,
            popularity: 83
        },
        {
            id: 8,
            title: "太空辐射防护材料研发成功",
            excerpt: "我们的材料科学团队成功研发出一种新型太空辐射防护材料，可以有效阻挡宇宙射线，同时重量仅为传统材料的一半�?,
            image: "images/news/radiation-shield.jpg",
            date: "2025-02-01",
            author: {
                name: "刘博�?,
                avatar: "images/team/liu.jpg"
            },
            tag: "研究进展",
            featured: false,
            popularity: 79
        },
        {
            id: 9,
            title: "NexusOrbital社区会员突破10�?,
            excerpt: "我们的平台社区会员数量已突破10万，来自全球100多个国家和地区。感谢所有会员的支持和参与！",
            image: "images/news/community.jpg",
            date: "2025-01-25",
            author: {
                name: "陈明�?,
                avatar: "images/team/chen.jpg"
            },
            tag: "平台公告",
            featured: false,
            popularity: 88
        }
    ];
}

/**
 * 处理图片加载错误
 */
function handleImageErrors() {
    // 获取所有图片元�?    const images = document.querySelectorAll('img');
    
    // 为每个图片添加错误处�?    images.forEach(img => {
        img.onerror = function() {
            // 设置默认图片
            this.src = 'images/placeholder.jpg';
            // 移除onerror处理器，防止循环
            this.onerror = null;
        };
    });
    
    // 处理背景图片
    const elementsWithBgImage = document.querySelectorAll('.news-image, .author-avatar, .featured-slide-image');
    
    elementsWithBgImage.forEach(el => {
        // 创建一个临时图片对象来测试背景图片是否存在
        const bgImage = getComputedStyle(el).backgroundImage;
        if (bgImage !== 'none') {
            const url = bgImage.replace(/url\(['"]?(.*?)['"]?\)/i, '$1');
            const img = new Image();
            img.onerror = function() {
                // 设置默认背景图片
                el.style.backgroundImage = 'url("images/placeholder.jpg")';
            };
            img.src = url;
        }
    });
}

/**
 * 创建新闻元素
 * @param {Object} news - 新闻数据
 * @returns {HTMLElement} - 新闻元素
 */
function createNewsElement(news) {
    const newsElement = document.createElement('div');
    newsElement.className = 'news-card';
    
    // 格式化日�?    const formattedDate = formatDate(news.date);
    
    // 构建新闻HTML
    newsElement.innerHTML = `
        <div class="news-card-image">
            <img src="${news.image}" alt="${news.title}" onerror="this.src='images/placeholder.jpg'">
            <div class="news-card-tag">${news.tag}</div>
        </div>
        <div class="news-card-content">
            <h3 class="news-card-title">
                <a href="news-detail.html?id=${news.id}">${news.title}</a>
            </h3>
            <p class="news-card-excerpt">${news.excerpt}</p>
            <div class="news-card-meta">
                <div class="news-card-author">
                    <img src="${news.author ? news.author.avatar : 'images/avatars/default.jpg'}" alt="${news.author ? news.author.name : '作�?}" class="author-avatar">
                    <span class="author-name">${news.author ? news.author.name : '匿名作�?}</span>
                </div>
                <div class="news-card-date">${formattedDate}</div>
            </div>
            <div class="news-card-stats">
                <span class="news-card-views"><i class="far fa-eye"></i> ${news.views || 0}</span>
                <span class="news-card-comments"><i class="far fa-comment"></i> ${getNewsCommentsCount(news.id)}</span>
            </div>
        </div>
    `;
    
    return newsElement;
}

/**
 * 获取新闻评论数量
 * @param {string} newsId - 新闻ID
 * @returns {number} - 评论数量
 */
function getNewsCommentsCount(newsId) {
    // 获取评论数据
    const newsComments = JSON.parse(localStorage.getItem('newsComments') || '[]');
    
    // 筛选当前新闻的评论
    return newsComments.filter(comment => comment.newsId === newsId).length;
}

/**
 * 加载特色新闻
 */
function loadFeaturedNews() {
    // 获取新闻数据
    const newsData = getNewsData();
    
    // 筛选特色新闻（取最新的3条新闻作为特色新闻）
    const featuredNews = [...newsData]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
    
    // 获取特色新闻容器
    const featuredSlider = document.getElementById('featuredNewsSlider');
    
    if (!featuredSlider || featuredNews.length === 0) return;
    
    // 清空容器
    featuredSlider.innerHTML = '';
    
    // 添加特色新闻
    featuredNews.forEach((news, index) => {
        const slideElement = document.createElement('div');
        slideElement.className = `featured-slide ${index === 0 ? 'active' : ''}`;
        
        // 格式化日�?        const formattedDate = formatDate(news.date);
        
        // 构建特色新闻HTML
        slideElement.innerHTML = `
            <div class="featured-slide-image">
                <img src="${news.image}" alt="${news.title}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="featured-slide-content">
                <div class="featured-slide-tag">${news.tag}</div>
                <h2 class="featured-slide-title">
                    <a href="news-detail.html?id=${news.id}">${news.title}</a>
                </h2>
                <p class="featured-slide-excerpt">${news.excerpt}</p>
                <div class="featured-slide-meta">
                    <div class="featured-slide-author">
                        <img src="${news.author ? news.author.avatar : 'images/avatars/default.jpg'}" alt="${news.author ? news.author.name : '作�?}" class="author-avatar">
                        <div class="author-info">
                            <span class="author-name">${news.author ? news.author.name : '匿名作�?}</span>
                            <span class="featured-slide-date">${formattedDate}</span>
                        </div>
                    </div>
                    <a href="news-detail.html?id=${news.id}" class="btn btn-primary">阅读全文</a>
                </div>
            </div>
        `;
        
        featuredSlider.appendChild(slideElement);
    });
    
    // 添加轮播控制
    const controlsElement = document.createElement('div');
    controlsElement.className = 'featured-slider-controls';
    
    // 构建轮播控制HTML
    controlsElement.innerHTML = `
        <button class="slider-control prev"><i class="fas fa-chevron-left"></i></button>
        <div class="slider-dots"></div>
        <button class="slider-control next"><i class="fas fa-chevron-right"></i></button>
    `;
    
    featuredSlider.appendChild(controlsElement);
    
    // 添加轮播�?    const dotsContainer = controlsElement.querySelector('.slider-dots');
    
    featuredNews.forEach((_, index) => {
        const dotElement = document.createElement('span');
        dotElement.className = `slider-dot ${index === 0 ? 'active' : ''}`;
        dotElement.dataset.index = index;
        
        dotElement.addEventListener('click', function() {
            showSlide(parseInt(this.dataset.index));
        });
        
        dotsContainer.appendChild(dotElement);
    });
    
    // 添加轮播控制按钮事件
    const prevButton = controlsElement.querySelector('.slider-control.prev');
    const nextButton = controlsElement.querySelector('.slider-control.next');
    
    let currentSlideIndex = 0;
    
    prevButton.addEventListener('click', function() {
        currentSlideIndex = (currentSlideIndex - 1 + featuredNews.length) % featuredNews.length;
        showSlide(currentSlideIndex);
    });
    
    nextButton.addEventListener('click', function() {
        currentSlideIndex = (currentSlideIndex + 1) % featuredNews.length;
        showSlide(currentSlideIndex);
    });
    
    // 自动轮播
    let slideInterval = setInterval(function() {
        currentSlideIndex = (currentSlideIndex + 1) % featuredNews.length;
        showSlide(currentSlideIndex);
    }, 5000);
    
    // 鼠标悬停时暂停轮�?    featuredSlider.addEventListener('mouseenter', function() {
        clearInterval(slideInterval);
    });
    
    featuredSlider.addEventListener('mouseleave', function() {
        slideInterval = setInterval(function() {
            currentSlideIndex = (currentSlideIndex + 1) % featuredNews.length;
            showSlide(currentSlideIndex);
        }, 5000);
    });
    
    // 显示指定轮播
    function showSlide(index) {
        // 更新轮播
        const slides = featuredSlider.querySelectorAll('.featured-slide');
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        
        // 更新轮播�?        const dots = dotsContainer.querySelectorAll('.slider-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        // 更新当前轮播索引
        currentSlideIndex = index;
    }
}

/**
 * 加载首页最新新�? */
function loadLatestNews() {
    // 获取新闻数据
    const newsData = getNewsData();
    
    // 获取最新新闻（取最新的4条新闻）
    const latestNews = [...newsData]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 4);
    
    // 获取新闻容器
    const newsContainer = document.querySelector('.latest-news-container');
    if (!newsContainer || latestNews.length === 0) return;
    
    // 清空容器
    newsContainer.innerHTML = '';
    
    // 填充最新新�?    latestNews.forEach(news => {
        const newsCard = createNewsElement(news);
        newsContainer.appendChild(newsCard);
    });
}

/**
 * 加载相关新闻
 */
function loadRelatedNews() {
    // 获取新闻ID
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');
    
    if (!newsId) return;
    
    // 获取新闻数据
    const newsData = getNewsData();
    const currentNews = newsData.find(news => news.id == newsId);
    
    if (!currentNews) return;
    
    // 获取相关新闻（同类别的其他新闻，最�?条）
    const relatedNews = newsData
        .filter(news => news.id != newsId && news.tag === currentNews.tag)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
    
    // 获取相关新闻容器
    const relatedNewsContainer = document.getElementById('relatedNews');
    if (!relatedNewsContainer) return;
    
    // 清空容器
    relatedNewsContainer.innerHTML = '';
    
    // 检查是否有相关新闻
    if (relatedNews.length === 0) {
        relatedNewsContainer.innerHTML = '<div class="no-related-news">暂无相关新闻</div>';
        return;
    }
    
    // 添加相关新闻
    relatedNews.forEach(news => {
        const newsElement = document.createElement('div');
        newsElement.className = 'related-news-card';
        
        // 格式化日�?        const formattedDate = formatDate(news.date);
        
        // 构建相关新闻HTML
        newsElement.innerHTML = `
            <div class="related-news-image">
                <img src="${news.image}" alt="${news.title}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="related-news-content">
                <h4 class="related-news-title">
                    <a href="news-detail.html?id=${news.id}">${news.title}</a>
                </h4>
                <div class="related-news-meta">
                    <span class="related-news-date">${formattedDate}</span>
                </div>
            </div>
        `;
        
        relatedNewsContainer.appendChild(newsElement);
    });
}

/**
 * 处理图片加载错误
 */
function handleImageErrors() {
    // 获取所有图�?    const images = document.querySelectorAll('img');
    
    // 添加错误处理
    images.forEach(img => {
        img.onerror = function() {
            this.src = 'images/placeholder.jpg';
        };
    });
}
