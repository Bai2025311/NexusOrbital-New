/**
 * NexusOrbital 支付模块前端脚本
 */

// 支付方式图标和名称
const PAYMENT_METHODS = {
  alipay: {
    name: '支付宝',
    icon: 'alipay-icon.png',
    description: '使用支付宝扫码支付'
  },
  wechat: {
    name: '微信支付',
    icon: 'wechat-icon.png',
    description: '使用微信扫码支付'
  },
  paypal: {
    name: 'PayPal',
    icon: 'paypal-icon.png',
    description: '使用PayPal账户支付'
  },
  stripe: {
    name: '信用卡',
    icon: 'stripe-icon.png',
    description: '使用Visa、Mastercard等信用卡支付'
  }
};

// 会员等级信息
const MEMBERSHIP_PLANS = {
  basic: {
    name: '基础会员',
    price: 9.99,
    currency: 'USD',
    features: [
      '访问基础太空技术资源库',
      '参与社区讨论',
      '查看开源项目'
    ]
  },
  professional: {
    name: '专业会员',
    price: 29.99,
    currency: 'USD',
    features: [
      '访问高级太空技术资源库',
      '参与专业讨论组',
      '下载专业设计资源',
      '获取月度研究报告'
    ]
  },
  enterprise: {
    name: '企业会员',
    price: 99.99,
    currency: 'USD',
    features: [
      '访问全部太空技术资源',
      '优先技术支持',
      '定制化项目咨询',
      '专属技术顾问',
      '企业级API访问权限'
    ]
  },
  founder: {
    name: '创始会员',
    price: 299.99,
    currency: 'USD',
    features: [
      '终身访问全部平台资源',
      '创始人社区专属身份',
      '参与平台发展决策',
      '优先获取新功能',
      '专属技术支持团队',
      '年度线下太空技术峰会邀请'
    ]
  }
};

class PaymentManager {
  constructor() {
    this.selectedPaymentMethod = null;
    this.selectedMembershipId = null;
    this.paymentAmount = 0;
    this.orderId = null;
    this.paymentData = null;
    this.qrCodeElement = null;
    this.statusCheckInterval = null;
    this.stripeElements = null;
    
    // 初始化支付方式选择器
    this.initPaymentMethodSelector();
    
    // 初始化会员计划选择器
    this.initMembershipPlanSelector();
    
    // 初始化支付按钮
    this.initPayButton();
    
    // 初始化交易记录按钮
    this.initTransactionHistoryButton();
  }
  
  /**
   * 初始化支付方式选择器
   */
  initPaymentMethodSelector() {
    const paymentMethodsContainer = document.getElementById('payment-methods');
    if (!paymentMethodsContainer) return;
    
    // 清空容器
    paymentMethodsContainer.innerHTML = '';
    
    // 添加支付方式选项
    Object.keys(PAYMENT_METHODS).forEach(method => {
      const methodData = PAYMENT_METHODS[method];
      const methodElement = document.createElement('div');
      methodElement.className = 'payment-method';
      methodElement.dataset.method = method;
      
      methodElement.innerHTML = `
        <div class="payment-method-icon">
          <img src="/images/payment/${methodData.icon}" alt="${methodData.name}">
        </div>
        <div class="payment-method-info">
          <h4>${methodData.name}</h4>
          <p>${methodData.description}</p>
        </div>
      `;
      
      // 添加点击事件
      methodElement.addEventListener('click', () => {
        // 移除其他选项的选中状态
        document.querySelectorAll('.payment-method').forEach(el => {
          el.classList.remove('selected');
        });
        
        // 添加选中状态
        methodElement.classList.add('selected');
        
        // 设置选中的支付方式
        this.selectedPaymentMethod = method;
        
        // 更新支付按钮状态
        this.updatePayButtonState();
      });
      
      paymentMethodsContainer.appendChild(methodElement);
    });
  }
  
  /**
   * 初始化会员计划选择器
   */
  initMembershipPlanSelector() {
    const membershipPlansContainer = document.getElementById('membership-plans');
    if (!membershipPlansContainer) return;
    
    // 清空容器
    membershipPlansContainer.innerHTML = '';
    
    // 添加会员计划选项
    Object.keys(MEMBERSHIP_PLANS).forEach(planId => {
      const planData = MEMBERSHIP_PLANS[planId];
      const planElement = document.createElement('div');
      planElement.className = 'membership-plan';
      planElement.dataset.plan = planId;
      
      // 构建特性列表
      const featuresList = planData.features.map(feature => `<li>${feature}</li>`).join('');
      
      planElement.innerHTML = `
        <div class="plan-header">
          <h3>${planData.name}</h3>
          <div class="plan-price">
            <span class="currency">${planData.currency}</span>
            <span class="amount">${planData.price}</span>
            <span class="period">/月</span>
          </div>
        </div>
        <div class="plan-features">
          <ul>
            ${featuresList}
          </ul>
        </div>
        <button class="select-plan-btn">选择此计划</button>
      `;
      
      // 添加点击事件
      const selectButton = planElement.querySelector('.select-plan-btn');
      selectButton.addEventListener('click', () => {
        // 移除其他计划的选中状态
        document.querySelectorAll('.membership-plan').forEach(el => {
          el.classList.remove('selected');
        });
        
        // 添加选中状态
        planElement.classList.add('selected');
        
        // 设置选中的会员计划
        this.selectedMembershipId = planId;
        this.paymentAmount = planData.price;
        
        // 更新支付按钮状态
        this.updatePayButtonState();
        
        // 滚动到支付方式选择区域
        document.getElementById('payment-methods-section').scrollIntoView({ behavior: 'smooth' });
      });
      
      membershipPlansContainer.appendChild(planElement);
    });
  }
  
  /**
   * 初始化支付按钮
   */
  initPayButton() {
    const payButton = document.getElementById('pay-button');
    if (!payButton) return;
    
    payButton.addEventListener('click', async () => {
      if (!this.selectedPaymentMethod || !this.selectedMembershipId) {
        this.showMessage('请选择会员计划和支付方式', 'error');
        return;
      }
      
      // 禁用支付按钮
      payButton.disabled = true;
      payButton.textContent = '处理中...';
      
      try {
        // 创建支付订单
        await this.createPaymentOrder();
        
        // 根据支付方式处理支付
        switch (this.selectedPaymentMethod) {
          case 'alipay':
          case 'wechat':
            this.handleQRCodePayment();
            break;
          case 'paypal':
            this.handlePayPalPayment();
            break;
          case 'stripe':
            this.handleStripePayment();
            break;
        }
      } catch (error) {
        console.error('支付处理失败:', error);
        this.showMessage('支付处理失败，请稍后重试', 'error');
        
        // 恢复支付按钮
        payButton.disabled = false;
        payButton.textContent = '立即支付';
      }
    });
    
    // 初始状态下禁用支付按钮
    this.updatePayButtonState();
  }
  
  /**
   * 初始化交易记录按钮
   */
  initTransactionHistoryButton() {
    const transactionHistoryButton = document.getElementById('transaction-history-button');
    if (!transactionHistoryButton) return;
    
    transactionHistoryButton.addEventListener('click', () => {
      window.location.href = '/account/transactions';
    });
  }
  
  /**
   * 更新支付按钮状态
   */
  updatePayButtonState() {
    const payButton = document.getElementById('pay-button');
    if (!payButton) return;
    
    if (this.selectedPaymentMethod && this.selectedMembershipId) {
      payButton.disabled = false;
    } else {
      payButton.disabled = true;
    }
  }
  
  /**
   * 创建支付订单
   */
  async createPaymentOrder() {
    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethod: this.selectedPaymentMethod,
          amount: this.paymentAmount,
          membershipId: this.selectedMembershipId,
          description: `升级到${MEMBERSHIP_PLANS[this.selectedMembershipId].name}`
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建支付订单失败');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '创建支付订单失败');
      }
      
      this.orderId = result.data.orderId;
      this.paymentData = result.data;
      
      return result.data;
    } catch (error) {
      console.error('创建支付订单失败:', error);
      this.showMessage('创建支付订单失败，请稍后重试', 'error');
      throw error;
    }
  }
  
  /**
   * 处理二维码支付（支付宝、微信支付）
   */
  handleQRCodePayment() {
    // 显示支付弹窗
    this.showPaymentModal();
    
    // 创建二维码容器
    const qrContainer = document.createElement('div');
    qrContainer.className = 'qr-code-container';
    
    // 添加标题
    const title = document.createElement('h3');
    title.textContent = `使用${PAYMENT_METHODS[this.selectedPaymentMethod].name}扫码支付`;
    qrContainer.appendChild(title);
    
    // 添加金额信息
    const amountInfo = document.createElement('p');
    amountInfo.className = 'amount-info';
    amountInfo.textContent = `支付金额: $${this.paymentAmount}`;
    qrContainer.appendChild(amountInfo);
    
    // 添加二维码元素
    this.qrCodeElement = document.createElement('div');
    this.qrCodeElement.id = 'payment-qrcode';
    qrContainer.appendChild(this.qrCodeElement);
    
    // 添加订单号信息
    const orderInfo = document.createElement('p');
    orderInfo.className = 'order-info';
    orderInfo.textContent = `订单号: ${this.orderId}`;
    qrContainer.appendChild(orderInfo);
    
    // 添加状态信息
    const statusInfo = document.createElement('p');
    statusInfo.className = 'status-info';
    statusInfo.textContent = '等待支付...';
    qrContainer.appendChild(statusInfo);
    
    // 将二维码容器添加到弹窗内容区域
    document.querySelector('.modal-content').appendChild(qrContainer);
    
    // 生成二维码
    if (this.selectedPaymentMethod === 'alipay') {
      // 支付宝直接使用返回的表单
      if (this.paymentData.formHtml) {
        const formContainer = document.createElement('div');
        formContainer.innerHTML = this.paymentData.formHtml;
        document.querySelector('.modal-content').appendChild(formContainer);
        
        // 自动提交表单
        setTimeout(() => {
          formContainer.querySelector('form').submit();
        }, 100);
      } else {
        // 使用二维码
        this.generateQRCode(this.paymentData.qrCodeUrl || this.paymentData.paymentUrl);
      }
    } else {
      // 微信支付使用二维码
      this.generateQRCode(this.paymentData.qrCodeUrl || this.paymentData.codeUrl);
    }
    
    // 开始轮询订单状态
    this.startStatusCheck();
  }
  
  /**
   * 处理PayPal支付
   */
  handlePayPalPayment() {
    // 直接跳转到PayPal支付页面
    window.location.href = this.paymentData.paymentUrl;
  }
  
  /**
   * 处理Stripe支付
   */
  async handleStripePayment() {
    // 显示支付弹窗
    this.showPaymentModal();
    
    // 创建Stripe支付表单容器
    const stripeContainer = document.createElement('div');
    stripeContainer.className = 'stripe-container';
    
    // 添加标题
    const title = document.createElement('h3');
    title.textContent = '信用卡支付';
    stripeContainer.appendChild(title);
    
    // 添加金额信息
    const amountInfo = document.createElement('p');
    amountInfo.className = 'amount-info';
    amountInfo.textContent = `支付金额: $${this.paymentAmount}`;
    stripeContainer.appendChild(amountInfo);
    
    // 添加Stripe元素容器
    const stripeElementsContainer = document.createElement('div');
    stripeElementsContainer.id = 'stripe-elements';
    stripeContainer.appendChild(stripeElementsContainer);
    
    // 添加卡号输入框
    const cardElement = document.createElement('div');
    cardElement.id = 'card-element';
    stripeElementsContainer.appendChild(cardElement);
    
    // 添加错误信息显示区域
    const cardErrors = document.createElement('div');
    cardErrors.id = 'card-errors';
    cardErrors.className = 'error-message';
    stripeElementsContainer.appendChild(cardErrors);
    
    // 添加支付按钮
    const payButton = document.createElement('button');
    payButton.id = 'stripe-pay-button';
    payButton.className = 'btn btn-primary';
    payButton.textContent = '确认支付';
    stripeElementsContainer.appendChild(payButton);
    
    // 将Stripe容器添加到弹窗内容区域
    document.querySelector('.modal-content').appendChild(stripeContainer);
    
    // 加载Stripe.js
    if (!window.Stripe) {
      const stripeScript = document.createElement('script');
      stripeScript.src = 'https://js.stripe.com/v3/';
      document.head.appendChild(stripeScript);
      
      // 等待Stripe.js加载完成
      await new Promise(resolve => {
        stripeScript.onload = resolve;
      });
    }
    
    // 初始化Stripe
    const stripe = window.Stripe(this.paymentData.publicKey || 'pk_test_sample');
    
    // 创建Stripe Elements
    const elements = stripe.elements();
    const card = elements.create('card');
    card.mount('#card-element');
    
    // 处理验证错误
    card.addEventListener('change', event => {
      const displayError = document.getElementById('card-errors');
      if (event.error) {
        displayError.textContent = event.error.message;
      } else {
        displayError.textContent = '';
      }
    });
    
    // 处理表单提交
    const form = document.getElementById('stripe-elements');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      
      // 禁用支付按钮
      payButton.disabled = true;
      payButton.textContent = '处理中...';
      
      try {
        // 确认支付
        const result = await stripe.confirmCardPayment(this.paymentData.clientSecret, {
          payment_method: {
            card: card
          }
        });
        
        if (result.error) {
          // 显示错误信息
          const errorElement = document.getElementById('card-errors');
          errorElement.textContent = result.error.message;
          
          // 恢复支付按钮
          payButton.disabled = false;
          payButton.textContent = '确认支付';
        } else {
          if (result.paymentIntent.status === 'succeeded') {
            // 支付成功，跳转到成功页面
            window.location.href = `/payment/success?order_id=${this.orderId}`;
          } else {
            // 需要进一步处理
            this.startStatusCheck();
          }
        }
      } catch (error) {
        console.error('Stripe支付处理失败:', error);
        
        // 显示错误信息
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = '支付处理失败，请稍后重试';
        
        // 恢复支付按钮
        payButton.disabled = false;
        payButton.textContent = '确认支付';
      }
    });
    
    // 添加按钮点击事件
    payButton.addEventListener('click', () => {
      form.dispatchEvent(new Event('submit'));
    });
  }
  
  /**
   * 生成二维码
   * @param {string} url - 二维码URL
   */
  generateQRCode(url) {
    if (!url) {
      this.showMessage('获取支付二维码失败', 'error');
      return;
    }
    
    // 检查是否已加载QRCode.js
    if (!window.QRCode) {
      // 加载QRCode.js
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js';
      document.head.appendChild(script);
      
      script.onload = () => {
        this.renderQRCode(url);
      };
    } else {
      this.renderQRCode(url);
    }
  }
  
  /**
   * 渲染二维码
   * @param {string} url - 二维码URL
   */
  renderQRCode(url) {
    if (!this.qrCodeElement) return;
    
    // 清空二维码容器
    this.qrCodeElement.innerHTML = '';
    
    // 创建二维码
    new QRCode(this.qrCodeElement, {
      text: url,
      width: 200,
      height: 200,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }
  
  /**
   * 开始轮询订单状态
   */
  startStatusCheck() {
    // 清除之前的轮询
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
    
    // 设置轮询间隔
    this.statusCheckInterval = setInterval(async () => {
      try {
        // 查询订单状态
        const response = await fetch(`/api/payment/status/${this.orderId}?paymentMethod=${this.selectedPaymentMethod}`);
        
        if (!response.ok) {
          throw new Error('查询订单状态失败');
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || '查询订单状态失败');
        }
        
        const status = result.data.status;
        
        // 更新状态信息
        const statusInfo = document.querySelector('.status-info');
        if (statusInfo) {
          statusInfo.textContent = this.getStatusText(status);
        }
        
        // 处理不同状态
        if (status === 'paid' || status === 'completed') {
          // 支付成功，停止轮询
          clearInterval(this.statusCheckInterval);
          this.statusCheckInterval = null;
          
          // 显示成功信息
          this.showMessage('支付成功！', 'success');
          
          // 延迟跳转到成功页面
          setTimeout(() => {
            window.location.href = `/payment/success?order_id=${this.orderId}`;
          }, 1500);
        } else if (status === 'failed' || status === 'cancelled') {
          // 支付失败，停止轮询
          clearInterval(this.statusCheckInterval);
          this.statusCheckInterval = null;
          
          // 显示失败信息
          this.showMessage('支付失败，请重试', 'error');
          
          // 关闭弹窗
          setTimeout(() => {
            this.closePaymentModal();
          }, 1500);
        }
      } catch (error) {
        console.error('查询订单状态失败:', error);
      }
    }, 3000); // 每3秒查询一次
  }
  
  /**
   * 获取状态文本
   * @param {string} status - 状态代码
   * @returns {string} - 状态文本
   */
  getStatusText(status) {
    const statusMap = {
      'created': '等待支付...',
      'pending': '等待支付...',
      'processing': '处理中...',
      'paid': '支付成功！',
      'completed': '支付成功！',
      'failed': '支付失败',
      'cancelled': '支付已取消',
      'refunded': '已退款'
    };
    
    return statusMap[status] || '未知状态';
  }
  
  /**
   * 显示支付弹窗
   */
  showPaymentModal() {
    // 创建弹窗容器
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // 创建弹窗内容
    modalContainer.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-dialog">
        <div class="modal-header">
          <h2>支付订单</h2>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-content"></div>
      </div>
    `;
    
    // 添加关闭按钮事件
    modalContainer.querySelector('.close-btn').addEventListener('click', () => {
      this.closePaymentModal();
    });
    
    // 添加点击遮罩层关闭弹窗
    modalContainer.querySelector('.modal-overlay').addEventListener('click', () => {
      this.closePaymentModal();
    });
    
    // 添加到页面
    document.body.appendChild(modalContainer);
    
    // 防止滚动
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * 关闭支付弹窗
   */
  closePaymentModal() {
    // 停止轮询
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
    
    // 移除弹窗
    const modalContainer = document.querySelector('.modal-container');
    if (modalContainer) {
      modalContainer.remove();
    }
    
    // 恢复滚动
    document.body.style.overflow = '';
    
    // 恢复支付按钮
    const payButton = document.getElementById('pay-button');
    if (payButton) {
      payButton.disabled = false;
      payButton.textContent = '立即支付';
    }
  }
  
  /**
   * 显示消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型（success, error, info）
   */
  showMessage(message, type = 'info') {
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    // 添加到页面
    document.body.appendChild(messageElement);
    
    // 显示动画
    setTimeout(() => {
      messageElement.classList.add('show');
    }, 10);
    
    // 自动关闭
    setTimeout(() => {
      messageElement.classList.remove('show');
      
      // 移除元素
      setTimeout(() => {
        messageElement.remove();
      }, 300);
    }, 3000);
  }
}

// 当页面加载完成时初始化支付管理器
document.addEventListener('DOMContentLoaded', () => {
  window.paymentManager = new PaymentManager();
});
