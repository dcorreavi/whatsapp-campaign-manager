import { EventEmitter } from 'events';

class WhatsAppService extends EventEmitter {
  private isReady = false;
  private isAuthenticating = false;
  private qrCode = '';
  private authStep = 'init'; // init, qr_shown, authenticated, ready

  constructor() {
    super();
  }

  async initialize() {
    if (this.isReady) {
      return { status: 'ready' };
    }

    this.isAuthenticating = true;
    this.authStep = 'qr_shown';
    
    // Generate a mock QR code for demonstration
    this.qrCode = 'MOCK_QR_CODE_' + Date.now();
    
    console.log('\n🔗 WhatsApp Web Authentication Required');
    console.log('📱 Please open WhatsApp Web in your browser and scan the QR code');
    console.log('🌐 Go to: https://web.whatsapp.com');
    console.log('\n⚠️  Note: For real WhatsApp integration:');
    console.log('   1. Install whatsapp-web.js: npm install whatsapp-web.js');
    console.log('   2. Uncomment the real WhatsApp client code');
    console.log('   3. Deploy with proper browser support (Puppeteer)');
    console.log('   4. Current demo mode logs messages to console');
    
    this.emit('qr', this.qrCode);
    
    // Simulate authentication process for demo
    setTimeout(() => {
      this.authStep = 'authenticated';
      this.emit('authenticated');
      
      setTimeout(() => {
        this.isReady = true;
        this.isAuthenticating = false;
        this.authStep = 'ready';
        this.emit('ready');
        console.log('\n✅ WhatsApp Web connected successfully (Demo Mode)');
      }, 2000);
    }, 3000);

    return { status: 'initializing' };
  }

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isReady) {
      throw new Error('WhatsApp client not ready');
    }

    try {
      // Format phone number for display
      let formattedNumber = phoneNumber.replace(/\D/g, '');
      if (formattedNumber.length === 10) {
        formattedNumber = '+1' + formattedNumber;
      } else if (!formattedNumber.startsWith('+')) {
        formattedNumber = '+' + formattedNumber;
      }
      
      // Log the message that would be sent
      console.log('\n📱 WhatsApp Message (Demo Mode):');
      console.log(`📞 To: ${formattedNumber}`);
      console.log(`💬 Message: ${message}`);
      console.log('🚀 Status: Would be sent via WhatsApp Web in production');
      console.log('');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  getStatus() {
    return {
      isReady: this.isReady,
      isAuthenticating: this.isAuthenticating,
      qrCode: this.qrCode,
      authStep: this.authStep
    };
  }

  async destroy() {
    this.isReady = false;
    this.isAuthenticating = false;
    this.qrCode = '';
    this.authStep = 'init';
  }
}

export const whatsappService = new WhatsAppService();