import React, { useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as DocumentPicker from 'expo-document-picker';
import { Asset } from 'expo-asset';
import * as Sharing from 'expo-sharing';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, api, Cart, NewProduct, Product, ProductReview, ProductSalesStats, User, Wallet, WithdrawalRequest, hasSession, saveSession } from './api';
import { ChatScreen } from './components/ChatScreen';

type TabKey = 'home' | 'cart' | 'orders' | 'library' | 'chat' | 'profile';
type ScreenKey = TabKey | 'detail' | 'topup' | 'seller' | 'checkout' | 'paymentRequired' | 'withdrawal';

const colors = {
  ink: '#1D2B25',
  muted: '#718078',
  cream: '#F4F0E8',
  mint: '#BBD8C5',
  orange: '#E97E52',
  white: '#FFFDF8',
  line: '#E4E0D7',
  soft: '#F8F5F0',
  danger: '#C75A4F',
};

const money = (value: number | string | undefined) => `${Number(value ?? 0).toLocaleString('vi-VN')} đ`;
const MINIMUM_SELLER_DEPOSIT = 50000000;
const SELLER_CONTRACT_RETURN_ADDRESS = 'Nà Ná Na Na, Hưng Yên';
const GUEST_HOME_KEY = 'dm_guest_home';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');
const TRANSFER_QR_URL = 'https://img.vietqr.io/image/TCB-8928929725-compact2.png?accountName=PHAM%20HUNG%20SANG';
const mediaUrl = (path?: string) => {
  if (!path) return undefined;
  return /^https?:\/\//i.test(path) ? path : `${API_ORIGIN}/${path.replace(/^\/+/, '')}`;
};

function Button({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.button, secondary && styles.buttonSecondary]}>
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

function SellerContractNotice() {
  const [opening, setOpening] = useState(false);

  const openContract = async () => {
    setOpening(true);
    try {
      if (!await Sharing.isAvailableAsync()) {
        Alert.alert('Không thể mở hợp đồng', 'Thiết bị hiện không hỗ trợ chia sẻ file.');
        return;
      }
      const asset = Asset.fromModule(require('../assets/Hop_dong_ky_quy_seller.docx'));
      const downloaded = await asset.downloadAsync();
      if (!downloaded.localUri) throw new Error('Không tải được file hợp đồng.');
      await Sharing.shareAsync(downloaded.localUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        dialogTitle: 'Hợp đồng ký quỹ seller',
        UTI: 'org.openxmlformats.wordprocessingml.document',
      });
    } catch (error) {
      Alert.alert('Không mở được hợp đồng', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <View style={styles.sellerContractNotice}>
      <Pressable style={styles.sellerContractButton} onPress={() => void openContract()} disabled={opening} accessibilityRole="button">
        <Ionicons name="document-text-outline" size={18} color={colors.ink} />
        <Text style={styles.sellerContractButtonText}>{opening ? 'Đang mở hợp đồng...' : 'Mở / tải hợp đồng ký quỹ'}</Text>
      </Pressable>
      <Text style={styles.sellerContractText}>Điền và ký hợp đồng, in 02 bản: Admin giữ 01 bản, Seller giữ 01 bản.</Text>
      <Text style={styles.sellerContractText}>Gửi bản đã ký về: {SELLER_CONTRACT_RETURN_ADDRESS}</Text>
    </View>
  );
}

function WelcomeScreen({ onScan, onLater }: { onScan: () => void; onLater: () => void }) {
  return (
    <SafeAreaView style={styles.welcomeScreen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.welcomeContent} showsVerticalScrollIndicator={false}>
      <View style={styles.statusRow}>
        <Text style={styles.statusTime}>12:55</Text>
        <View style={styles.statusCenter}>
          <View style={styles.signalBadge}><Text style={styles.signalBadgeText}>1</Text></View>
          <View style={styles.signalBar}><View style={styles.signalBarActive} /></View>
        </View>
        <View style={styles.statusRight}>
          <Text style={styles.statusWiFi}>183,4 5G</Text>
          <View style={styles.batteryBox}><View style={styles.batteryFill} /></View>
        </View>
      </View>

      <View style={styles.authHeader}>
        <View style={styles.brandMark}>
          <Text style={styles.brandLetter}>d/</Text>
        </View>
        <Pressable style={styles.settingButton} accessibilityLabel="Cài đặt">
          <Ionicons name="settings-outline" size={28} color={colors.ink} />
        </Pressable>
      </View>

      <Text style={styles.eyebrow}>DIGITAL MARKETPLACE</Text>
      <Text style={styles.authTitle}>{`Bắt đầu sưu\ntầm.`}</Text>
      <Text style={styles.authCopy}>Những sản phẩm số được chọn lọc cho công việc và đời sống sáng tạo.</Text>

      <Pressable style={styles.qrCard} onPress={onScan}>
        <View style={styles.qrCodeBox}>
          <View style={styles.qrPattern} />
          <View style={styles.qrPatternSmall} />
          <View style={styles.qrPatternTiny} />
        </View>
        <Text style={styles.qrTitle}>Quét mã QR</Text>
        <Text style={styles.qrSubtitle}>Mở ngay trang chủ và khám phá sản phẩm</Text>
      </Pressable>

      <Pressable style={styles.secondaryAction} onPress={onLater}>
        <Text style={styles.secondaryActionText}>Sau</Text>
      </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Auth({ onLogin }: { onLogin: (user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('Người dùng');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Thiếu thông tin', 'Nhập email và mật khẩu để đăng nhập.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'register') {
        await api.register({
          fullName: fullName.trim() || 'Người dùng',
          email: email.trim(),
          phone: phone.trim() || '0000000000',
          password,
        });
      }
      const result = await api.login(email.trim(), password);
      await saveSession(result.data.accessToken, result.data.refreshToken);
      onLogin(result.data.user);
    } catch (error) {
      Alert.alert('Chưa thể tiếp tục', error instanceof Error ? error.message : 'Vui lòng thử lại');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.auth}>
      <StatusBar style="dark" />

      <View style={styles.authHeader}>
        <View style={styles.brandMark}>
          <Text style={styles.brandLetter}>d/</Text>
        </View>
        <Pressable style={styles.settingButton} accessibilityLabel="Cài đặt">
          <Ionicons name="settings-outline" size={28} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.authCard}>
        <Text style={styles.eyebrow}>{mode === 'login' ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}</Text>
        <Text style={styles.authTitle}>{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}</Text>

        {mode === 'register' && (
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Họ và tên</Text>
            <TextInput
              placeholder="Nhập họ tên"
              placeholderTextColor={colors.muted}
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
            />
          </View>
        )}

        {mode === 'register' && (
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Số điện thoại</Text>
            <TextInput
              placeholder="Nhập số điện thoại"
              placeholderTextColor={colors.muted}
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
              keyboardType="phone-pad"
            />
          </View>
        )}

        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            placeholder="sang1@gmail.com"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Mật khẩu</Text>
          <TextInput
            placeholder="Nhập mật khẩu"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />
        </View>

        {busy ? (
          <ActivityIndicator color={colors.orange} style={styles.loader} />
        ) : (
          <Pressable style={styles.primaryButton} onPress={submit}>
            <Text style={styles.primaryButtonText}>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</Text>
          </Pressable>
        )}

        <Pressable onPress={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}>
          <Text style={styles.switchText}>
            {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({
  onOpenProduct,
  onAddToCart,
}: {
  onOpenProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (query = '') => {
    setLoading(true);
    try {
      const [productResult, categoryResult] = await Promise.all([api.products(query), api.categories()]);
      setProducts(productResult.data.items || []);
      setCategories(categoryResult.data || []);
    } catch (error) {
      Alert.alert('Không tải được sản phẩm', error instanceof Error ? error.message : 'Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const renderItem = ({ item }: { item: Product }) => (
    <Pressable key={item.id} style={styles.productCard} onPress={() => onOpenProduct(item)}>
      <View style={styles.productImageWrap}>
        {item.thumbnail ? (
          <Image source={{ uri: mediaUrl(item.thumbnail) }} style={styles.productImage} />
        ) : (
          <View style={styles.fakeThumb}><Text style={styles.fakeThumbText}>{item.type === 'ebook' ? 'EBOOK' : 'D'}</Text></View>
        )}
      </View>
      <Text style={styles.productTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.productMeta}>{item.seller?.fullName || 'Digital creator'}</Text>
      <View style={styles.productRow}>
        <Text style={styles.price}>{money(item.price)}</Text>
        <Pressable style={styles.smallBtn} onPress={() => onAddToCart(item)}>
          <Text style={styles.smallBtnText}>Thêm</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <ScrollView style={styles.pageScroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>KHÔNG GIAN CỦA BẠN</Text>
        <Text style={styles.heroTitle}>{`Mua một lần.\nDùng mãi mãi.`}</Text>
        <Text style={styles.heroCopy}>Tài nguyên số cho những ý tưởng lớn và công việc sáng tạo.</Text>
        <View style={styles.heroOrb}>
          <Text style={styles.orbText}>{`new\ndrop`}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load(search.trim() ? `q=${encodeURIComponent(search.trim())}` : '')}
          style={styles.searchInput}
          placeholder="Tìm sản phẩm, template, ebook..."
          placeholderTextColor={colors.muted}
        />
        <Ionicons name="options-outline" size={18} color={colors.ink} />
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Khám phá</Text>
        <Text style={styles.sectionLink}>{products.length} sản phẩm</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipWrap}>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => load(`categoryId=${category.id}`)}
            style={styles.chip}
          >
            <Text style={styles.chipText}>{category.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={colors.orange} style={styles.loader} />
      ) : (
        <FlatList
          data={products}
          scrollEnabled={false}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.gridRow}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScrollView>
  );
}

function ProductDetailScreen({
  product,
  userId,
  onAddToCart,
  onChat,
  onBack,
}: {
  product: Product;
  userId: string;
  onAddToCart: (product: Product) => void;
  onChat: (participantId: string, productId: string) => void;
  onBack: () => void;
}) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewLoading, setReviewLoading] = useState(true);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const hasReviewed = reviews.some((review) => review.userId === userId);
  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : 0;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setReviewLoading(true);
      setEligibilityLoading(true);
      setReviewError('');
      const [reviewResult, libraryResult] = await Promise.allSettled([
        api.productReviews(product.id),
        api.library(),
      ]);
      if (!active) return;

      if (reviewResult.status === 'fulfilled') {
        setReviews(reviewResult.value.data || []);
      } else {
        setReviews([]);
        setReviewError(reviewResult.reason instanceof Error ? reviewResult.reason.message : 'Vui lòng thử lại.');
      }
      if (libraryResult.status === 'fulfilled') {
        setCanReview(libraryResult.value.data.some((license) => license.productId === product.id && license.status === 'active'));
      } else {
        setCanReview(false);
      }
      setReviewLoading(false);
      setEligibilityLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [product.id]);

  const submitReview = async () => {
    const content = reviewContent.trim();
    if (!content) {
      Alert.alert('Thiếu nội dung', 'Hãy nhập nhận xét trước khi gửi.');
      return;
    }

    setSubmittingReview(true);
    try {
      const result = await api.createProductReview(product.id, rating, content);
      setReviews((current) => [result.data, ...current]);
      setReviewContent('');
      Alert.alert('Đã gửi đánh giá', 'Cảm ơn bạn đã chia sẻ trải nghiệm.');
    } catch (error) {
      Alert.alert('Không gửi được đánh giá', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitReport = async () => {
    const reason = reportReason.trim();
    const reportedUserId = product.seller?.id;
    if (!reportedUserId || reportedUserId === userId) return;
    if (!reason) {
      Alert.alert('Thiếu lý do', 'Hãy mô tả vi phạm bạn muốn báo cáo.');
      return;
    }

    setSubmittingReport(true);
    try {
      await api.createReport(reportedUserId, reason);
      setReportReason('');
      setShowReportForm(false);
      Alert.alert('Đã gửi báo cáo', 'Cảm ơn bạn đã giúp cộng đồng an toàn hơn.');
    } catch (error) {
      Alert.alert('Không gửi được báo cáo', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable style={styles.backHeader} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={colors.ink} />
        <Text style={styles.backText}>Quay lại</Text>
      </Pressable>

      <View style={styles.detailImageWrap}>
        {product.thumbnail ? (
          <Image source={{ uri: mediaUrl(product.thumbnail) }} style={styles.detailImage} />
        ) : (
          <View style={styles.detailPlaceholder}>
            <Text style={styles.fakeThumbText}>{product.type === 'ebook' ? 'EBOOK' : 'D'}</Text>
          </View>
        )}
      </View>

      <Text style={styles.eyebrow}>{product.Category?.name || 'Digital product'}</Text>
      <Text style={styles.detailTitle}>{product.title}</Text>
      <Text style={styles.priceLarge}>{money(product.price)}</Text>
      <Text style={styles.detailMeta}>{product.seller?.fullName || 'Digital creator'}</Text>

      <Text style={styles.sectionTitle}>Mô tả</Text>
      <Text style={styles.detailBody}>{product.description || 'Không có mô tả chi tiết cho sản phẩm này.'}</Text>

      <View style={styles.detailActions}>
        <Button label="Thêm vào giỏ" onPress={() => onAddToCart(product)} />
        {product.seller?.id && product.seller.id !== userId ? (
          <Button label="Nhắn tin người bán" onPress={() => onChat(product.seller!.id!, product.id)} secondary />
        ) : null}
      </View>

      {product.seller?.id && product.seller.id !== userId ? (
        <View style={styles.reportSection}>
          <Pressable
            style={styles.reportAction}
            onPress={() => setShowReportForm((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel="Báo cáo người bán"
          >
            <Ionicons name="flag-outline" size={17} color={colors.danger} />
            <Text style={styles.reportActionText}>{showReportForm ? 'Đóng báo cáo' : 'Báo cáo người bán'}</Text>
          </Pressable>
          {showReportForm ? (
            <View style={styles.reviewForm}>
              <Text style={styles.inputLabel}>Lý do báo cáo</Text>
              <TextInput
                value={reportReason}
                onChangeText={setReportReason}
                style={styles.reviewInput}
                placeholder="Mô tả nội dung hoặc hành vi vi phạm..."
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                maxLength={2000}
              />
              <Pressable style={styles.reviewSubmit} onPress={submitReport} disabled={submittingReport}>
                <Text style={styles.reviewSubmitText}>{submittingReport ? 'Đang gửi...' : 'Gửi báo cáo'}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.reviewSection}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Đánh giá</Text>
          <Text style={styles.reviewSummary}>
            {reviewLoading ? 'Đang tải...' : reviews.length ? `${averageRating.toFixed(1)} ★ · ${reviews.length} lượt` : 'Chưa có đánh giá'}
          </Text>
        </View>

        {reviewError ? <Text style={styles.reviewHint}>Không tải được đánh giá: {reviewError}</Text> : null}

        {!eligibilityLoading && canReview && !reviewLoading && (hasReviewed ? (
          <Text style={styles.reviewHint}>Bạn đã gửi đánh giá cho sản phẩm này.</Text>
        ) : (
          <View style={styles.reviewForm}>
            <Text style={styles.inputLabel}>Trải nghiệm của bạn</Text>
            <View style={styles.ratingPicker}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setRating(value)}
                  accessibilityRole="button"
                  accessibilityLabel={`${value} sao`}
                  accessibilityState={{ selected: rating === value }}
                  hitSlop={6}
                >
                  <Ionicons name={value <= rating ? 'star' : 'star-outline'} size={28} color={colors.orange} />
                </Pressable>
              ))}
            </View>
            <TextInput
              value={reviewContent}
              onChangeText={setReviewContent}
              style={styles.reviewInput}
              placeholder="Chia sẻ nhận xét của bạn..."
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />
            <Pressable style={styles.reviewSubmit} onPress={submitReview} disabled={submittingReview}>
              <Text style={styles.reviewSubmitText}>{submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}</Text>
            </Pressable>
          </View>
        ))}

        {!eligibilityLoading && !canReview ? (
          <Text style={styles.reviewHint}>Chỉ người đã sở hữu sản phẩm mới có thể đánh giá.</Text>
        ) : null}

        {reviewLoading ? (
          <ActivityIndicator color={colors.orange} style={styles.loader} />
        ) : reviews.length === 0 ? (
          <Text style={styles.reviewHint}>Hãy là người đầu tiên đánh giá sản phẩm này.</Text>
        ) : reviews.map((review) => (
          <View key={review.id} style={styles.reviewItem}>
            <View style={styles.reviewItemHeader}>
              <Text style={styles.reviewAuthor}>{review.user?.fullName || 'Người dùng'}</Text>
              <Text style={styles.reviewDate}>{review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : ''}</Text>
            </View>
            <View style={styles.reviewStars}>
              {Array.from({ length: 5 }, (_, index) => (
                <Ionicons key={index} name={index < review.rating ? 'star' : 'star-outline'} size={14} color={colors.orange} />
              ))}
            </View>
            <Text style={styles.reviewContent}>{review.content}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function CartScreen({
  cart,
  loading,
  onRefresh,
  onRemoveItem,
  onCheckout,
}: {
  cart: Cart | null;
  loading: boolean;
  onRefresh: () => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}) {
  const items = cart?.CartItems || [];
  const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.sectionHead}>
        <Text style={styles.pageTitle}>Giỏ hàng</Text>
        <Pressable onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={22} color={colors.ink} />
        </Pressable>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bag-handle-outline" size={38} color={colors.orange} />
          <Text style={styles.emptyText}>Giỏ hàng đang trống</Text>
        </View>
      ) : (
        <>
          {items.map((item) => (
            <View style={styles.cartRow} key={item.id}>
              <View style={styles.cartThumb}>
                <Text style={styles.fakeThumbText}>{item.Product?.type === 'ebook' ? 'E' : 'D'}</Text>
              </View>
              <View style={styles.cartTextWrap}>
                <Text style={styles.productTitle}>{item.Product?.title || 'Sản phẩm số'}</Text>
                <Text style={styles.productMeta}>Số lượng: {item.quantity}</Text>
                <Text style={styles.price}>{money(item.price)}</Text>
              </View>
              <Pressable onPress={() => onRemoveItem(item.id)}>
                <Ionicons name="close-circle-outline" size={22} color={colors.muted} />
              </Pressable>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalPrice}>{money(total)}</Text>
          </View>

          <Button label="Xem xác nhận thanh toán" onPress={onCheckout} />
        </>
      )}
    </ScrollView>
  );
}

function CheckoutScreen({
  cart,
  onBack,
  onConfirm,
}: {
  cart: Cart | null;
  onBack: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const items = cart?.CartItems || [];
  const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable style={styles.backHeader} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={colors.ink} />
        <Text style={styles.backText}>Giỏ hàng</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Xác nhận thanh toán</Text>

      <View style={styles.checkoutItems}>
        <Text style={styles.checkoutSectionTitle}>Sản phẩm</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.checkoutItem}>
            <View style={styles.checkoutItemInfo}>
              <Text style={styles.productTitle}>{item.Product?.title || 'Sản phẩm số'}</Text>
              <Text style={styles.productMeta}>Số lượng: {item.quantity}</Text>
            </View>
            <Text style={styles.checkoutItemPrice}>{money(Number(item.price) * Number(item.quantity))}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng thanh toán</Text>
          <Text style={styles.totalPrice}>{money(total)}</Text>
        </View>
      </View>

      <View style={styles.transferCard}>
        <Text style={styles.transferTitle}>Techcombank</Text>
        <Text style={styles.transferName}>PHAM HUNG SANG</Text>
        <Text style={styles.transferAccount}>8928 9297 25</Text>
        <Image source={{ uri: TRANSFER_QR_URL }} style={styles.transferQr} resizeMode="contain" />
        <Text style={styles.transferFootnote}>Quét QR và chuyển đúng số tiền {money(total)}. QR tĩnh không tự xác minh giao dịch ngân hàng. Nút xác nhận bên dưới dùng luồng thanh toán mô phỏng hiện tại.</Text>
      </View>

      <Pressable style={[styles.topUpButton, (busy || items.length === 0) && styles.checkoutButtonDisabled]} onPress={() => void confirm()} disabled={busy || items.length === 0}>
        <Text style={styles.topUpButtonText}>{busy ? 'Đang xác nhận...' : 'Xác nhận mua hàng'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function PaymentRequiredScreen({
  totalAmount,
  walletBalance,
  onTopUp,
  onRetry,
}: {
  totalAmount: number;
  walletBalance: number;
  onTopUp: () => void;
  onRetry: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const shortfall = Math.max(0, totalAmount - walletBalance);

  const retry = async () => {
    setBusy(true);
    try {
      await onRetry();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.paymentRequiredHeader}>
        <Ionicons name="wallet-outline" size={30} color={colors.orange} />
        <Text style={styles.pageTitle}>Ví chưa đủ số dư</Text>
        <Text style={styles.paymentRequiredCopy}>Đơn hàng đang chờ thanh toán. Nạp thêm tiền vào ví rồi thử lại để hoàn tất mua hàng.</Text>
      </View>
      <View style={styles.paymentAmounts}>
        <View style={styles.paymentAmountRow}>
          <Text style={styles.totalLabel}>Tổng đơn hàng</Text>
          <Text style={styles.checkoutItemPrice}>{money(totalAmount)}</Text>
        </View>
        <View style={styles.paymentAmountRow}>
          <Text style={styles.totalLabel}>Số dư hiện tại</Text>
          <Text style={styles.checkoutItemPrice}>{money(walletBalance)}</Text>
        </View>
        <View style={[styles.paymentAmountRow, styles.shortfallRow]}>
          <Text style={styles.shortfallLabel}>Cần nạp thêm</Text>
          <Text style={styles.shortfallValue}>{money(shortfall)}</Text>
        </View>
      </View>
      <Button label="Nạp thêm tiền vào ví" onPress={onTopUp} />
      <View style={styles.paymentRetry}>
        <Button label={busy ? 'Đang kiểm tra...' : 'Tôi đã nạp, thanh toán lại'} onPress={() => void retry()} secondary />
      </View>
    </ScrollView>
  );
}

function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await api.orders();
        setOrders(result.data || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Đơn hàng</Text>
      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={38} color={colors.orange} />
          <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
        </View>
      ) : (
        orders.map((order) => {
          const items = order.OrderItems || [];
          const total = items.reduce((sum: number, item: any) => sum + Number(item.price) * Number(item.quantity), 0);

          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderCardHeader}>
                <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
                <Text style={styles.orderStatus}>{order.status || 'pending'}</Text>
              </View>
              {items.map((item: any) => (
                <View key={item.id} style={styles.orderItemRow}>
                  <Text style={styles.orderItemText}>{item.Product?.title || 'Sản phẩm số'}</Text>
                  <Text style={styles.orderItemMeta}>x{item.quantity}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng</Text>
                <Text style={styles.totalPrice}>{money(total || order.totalAmount || 0)}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function LibraryScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await api.library();
        setItems(result.data || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  }

  const openItem = async (productId: string) => {
    try {
      const signedUrl = await api.getSignedContentUrl(productId);
      const baseUrl = API_URL.replace(/\/api$/, '');
      const fullUrl = `${baseUrl}${signedUrl.data.url}`;
      await Linking.openURL(fullUrl);
    } catch (error) {
      Alert.alert('Không mở được nội dung', error instanceof Error ? error.message : 'Vui lòng thử lại');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Thư viện của tôi</Text>
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="library-outline" size={38} color={colors.orange} />
          <Text style={styles.emptyText}>Thư viện đang chờ bạn</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.libraryCard}>
            <View style={styles.libraryIcon}>
              <Ionicons name="document-text-outline" size={22} color={colors.ink} />
            </View>
            <View style={styles.libraryTextWrap}>
              <Text style={styles.productTitle}>{item.Product?.title || 'Sản phẩm số'}</Text>
              <Text style={styles.productMeta}>{item.status || 'active'}</Text>
            </View>
            <Pressable onPress={() => openItem(item.productId)} style={styles.libraryOpen}>
              <Text style={styles.libraryOpenText}>Mở</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function ProfileScreen({
  user,
  wallet,
  onWalletChanged,
  onOpenTopUp,
  onOpenWithdrawal,
  onOpenSeller,
  onOpenSupport,
  onLogout,
}: {
  user: User;
  wallet: Wallet | null;
  onWalletChanged: (wallet?: Wallet) => Promise<void>;
  onOpenTopUp: () => void;
  onOpenWithdrawal: () => void;
  onOpenSeller: () => void;
  onOpenSupport: () => Promise<void>;
  onLogout: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [openingSupport, setOpeningSupport] = useState(false);
  const contractRegistered = wallet?.contractStatus === 'registered';

  const openSupport = async () => {
    setOpeningSupport(true);
    try {
      await onOpenSupport();
    } finally {
      setOpeningSupport(false);
    }
  };

  const registerContract = async () => {
    const minimum = Number(wallet?.minimumDeposit || MINIMUM_SELLER_DEPOSIT);
    setBusy(true);
    try {
      const result = await api.registerSellerContract(minimum);
      await onWalletChanged(result.data.wallet);
      Alert.alert('Đăng ký thành công', 'Tài khoản đã được kích hoạt quyền đăng bán sản phẩm.');
    } catch (error) {
      Alert.alert('Chưa thể đăng ký hợp đồng', error instanceof Error ? error.message : 'Vui lòng thử lại');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Tài khoản</Text>
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user.fullName?.slice(0, 1).toUpperCase() || 'U'}</Text>
        </View>
        <Text style={styles.profileName}>{user.fullName}</Text>
        <Text style={styles.productMeta}>{user.email}</Text>
      </View>

      <View style={styles.walletCard}>
        <Text style={styles.eyebrow}>VÍ CỦA BẠN</Text>
        <Text style={styles.walletBalance}>{money(wallet?.balance || 0)}</Text>
        <View style={styles.walletStats}>
          <View style={styles.walletStatBox}>
            <Text style={styles.walletStatLabel}>Tiền đang có</Text>
            <Text style={styles.walletStatValue}>{money(wallet?.balance || 0)}</Text>
          </View>
          {contractRegistered ? (
            <View style={styles.walletStatBox}>
              <Text style={styles.walletStatLabel}>Escrow</Text>
              <Text style={styles.walletStatValue}>{money(wallet?.escrowBalance || 0)}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.contractStatusRow}>
          <Text style={styles.walletStatLabel}>Hợp đồng seller</Text>
          <Text style={[styles.contractStatus, contractRegistered && styles.contractStatusActive]}>
            {contractRegistered ? 'Đã kích hoạt' : wallet?.contractStatus === 'suspended' ? 'Tạm ngưng' : 'Chưa đăng ký'}
          </Text>
        </View>
        <Pressable style={styles.walletActionPrimary} onPress={onOpenTopUp}>
          <Text style={styles.walletActionPrimaryText}>Nạp tiền vào ví</Text>
        </Pressable>
        <Pressable style={styles.walletActionSecondary} onPress={onOpenWithdrawal}>
          <Text style={styles.walletActionSecondaryText}>Rút tiền</Text>
        </Pressable>
        {contractRegistered && (
          <Pressable style={styles.sellerEntryButton} onPress={onOpenSeller}>
            <Ionicons name="storefront-outline" size={19} color={colors.ink} />
            <Text style={styles.sellerEntryText}>Đăng bán và quản lý sản phẩm</Text>
          </Pressable>
        )}
        {!contractRegistered && (
          <>
            <Text style={styles.contractHint}>Cần ký quỹ tối thiểu {money(wallet?.minimumDeposit || MINIMUM_SELLER_DEPOSIT)} để đăng bán sản phẩm.</Text>
            <SellerContractNotice />
            <Pressable style={styles.walletActionSecondary} onPress={registerContract} disabled={busy}>
              <Text style={styles.walletActionSecondaryText}>{busy ? 'Đang xử lý...' : 'Đăng ký seller'}</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.settingsBlock}>
        {['Thông tin cá nhân', 'Thông báo', 'Hỗ trợ & trợ giúp'].map((item) => (
          <Pressable key={item} style={styles.settingRow} onPress={item === 'Hỗ trợ & trợ giúp' ? () => void openSupport() : undefined} disabled={item === 'Hỗ trợ & trợ giúp' && openingSupport}>
            <Text style={styles.settingText}>{openingSupport && item === 'Hỗ trợ & trợ giúp' ? 'Đang mở hỗ trợ...' : item}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </View>

      <Button label="Đăng xuất" secondary onPress={onLogout} />
    </ScrollView>
  );
}

function WithdrawalScreen({
  wallet,
  onWalletUpdated,
  onBack,
}: {
  wallet: Wallet | null;
  onWalletUpdated: (wallet: Wallet) => void;
  onBack: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [withdrawAll, setWithdrawAll] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const balance = Number(wallet?.balance || 0);

  const loadRequests = async () => {
    try {
      const result = await api.withdrawalRequests();
      setRequests(result.data || []);
    } catch (error) {
      Alert.alert('Không tải được lịch sử rút tiền', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadRequests(); }, []);

  const submit = async () => {
    const amountValue = withdrawAll ? balance : Number(amount.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(amountValue) || amountValue < 10000) {
      Alert.alert('Số tiền không hợp lệ', 'Số tiền rút tối thiểu là 10.000đ.');
      return;
    }
    if (!bankName.trim() || !bankAccount.trim() || !accountHolder.trim()) {
      Alert.alert('Thiếu thông tin ngân hàng', 'Nhập ngân hàng, số tài khoản và tên chủ tài khoản.');
      return;
    }

    setBusy(true);
    try {
      const result = await api.createWithdrawalRequest({
        amount: amountValue,
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        accountHolder: accountHolder.trim(),
      });
      onWalletUpdated(result.data.wallet);
      setAmount('');
      setWithdrawAll(false);
      await loadRequests();
      Alert.alert('Đã gửi yêu cầu', 'Số tiền đã được giữ lại trong lúc admin xét duyệt.');
    } catch (error) {
      Alert.alert('Không gửi được yêu cầu', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const statusText = (status: WithdrawalRequest['status']) => status === 'pending' ? 'Đang chờ duyệt' : status === 'approved' ? 'Đã duyệt' : 'Đã từ chối';

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.backHeader} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={colors.ink} />
        <Text style={styles.backText}>Tài khoản</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Rút tiền về ngân hàng</Text>
      <Text style={styles.topUpIntro}>Số dư khả dụng: {money(balance)}. Yêu cầu sẽ được admin duyệt trước khi chuyển khoản.</Text>

      <View style={styles.withdrawalForm}>
        <Text style={styles.inputLabel}>Số tiền muốn rút</Text>
        <TextInput
          value={withdrawAll ? String(balance) : amount}
          onChangeText={(value) => { setWithdrawAll(false); setAmount(value.replace(/[^0-9]/g, '')); }}
          style={styles.walletInput}
          placeholder="Tối thiểu 10.000đ"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          editable={!withdrawAll}
        />
        <Pressable style={[styles.withdrawAllButton, withdrawAll && styles.withdrawAllButtonActive]} onPress={() => { setWithdrawAll((current) => !current); setAmount(''); }}>
          <Ionicons name={withdrawAll ? 'checkbox' : 'square-outline'} size={18} color={withdrawAll ? colors.white : colors.ink} />
          <Text style={[styles.withdrawAllText, withdrawAll && styles.withdrawAllTextActive]}>Rút toàn bộ số dư</Text>
        </Pressable>

        <Text style={styles.inputLabel}>Ngân hàng</Text>
        <TextInput value={bankName} onChangeText={setBankName} style={styles.walletInput} placeholder="Ví dụ: Vietcombank" placeholderTextColor={colors.muted} />
        <Text style={styles.inputLabel}>Số tài khoản</Text>
        <TextInput value={bankAccount} onChangeText={setBankAccount} style={styles.walletInput} placeholder="Nhập số tài khoản" placeholderTextColor={colors.muted} keyboardType="number-pad" />
        <Text style={styles.inputLabel}>Tên chủ tài khoản</Text>
        <TextInput value={accountHolder} onChangeText={setAccountHolder} style={styles.walletInput} placeholder="Tên không dấu như trên ngân hàng" placeholderTextColor={colors.muted} autoCapitalize="characters" />
        <Pressable style={styles.topUpButton} onPress={() => void submit()} disabled={busy}>
          <Text style={styles.topUpButtonText}>{busy ? 'Đang gửi...' : `Gửi yêu cầu ${money(withdrawAll ? balance : Number(amount) || 0)}`}</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Lịch sử yêu cầu</Text>
      {loading ? <ActivityIndicator color={colors.orange} style={styles.loader} /> : requests.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có yêu cầu rút tiền.</Text>
      ) : requests.map((request) => (
        <View key={request.id} style={styles.withdrawalRequestRow}>
          <View style={styles.withdrawalRequestHeading}>
            <Text style={styles.productTitle}>{money(request.amount)}</Text>
            <Text style={[styles.withdrawalStatus, request.status === 'approved' ? styles.withdrawalApproved : request.status === 'rejected' ? styles.withdrawalRejected : styles.withdrawalPending]}>{statusText(request.status)}</Text>
          </View>
          <Text style={styles.productMeta}>{request.bankName} · {request.bankAccount} · {request.accountHolder}</Text>
          {request.adminNote ? <Text style={styles.withdrawalNote}>Ghi chú admin: {request.adminNote}</Text> : null}
          <Text style={styles.withdrawalDate}>{request.createdAt ? new Date(request.createdAt).toLocaleString('vi-VN') : ''}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function WalletTopUpScreen({
  wallet,
  onWalletUpdated,
  onBack,
  initialAmount,
}: {
  wallet: Wallet | null;
  onWalletUpdated: (wallet: Wallet) => void;
  onBack: () => void;
  initialAmount?: number;
}) {
  const [amount, setAmount] = useState(String(initialAmount || MINIMUM_SELLER_DEPOSIT));
  const [busy, setBusy] = useState(false);
  const contractRegistered = wallet?.contractStatus === 'registered';
  const topUp = async () => {
    const value = Number(amount.replace(/[^0-9]/g, ''));
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert('Số tiền không hợp lệ', 'Nhập số tiền lớn hơn 0.');
      return;
    }
    setBusy(true);
    try {
      const result = await api.depositWallet(value);
      onWalletUpdated(result.data);
      Alert.alert('Nạp ví thành công', `Đã cộng ${money(value)} vào ví mô phỏng.`);
    } catch (error) {
      Alert.alert('Không thể nạp ví', error instanceof Error ? error.message : 'Vui lòng thử lại');
    } finally {
      setBusy(false);
    }
  };

  const registerSeller = async () => {
    const minimum = Number(wallet?.minimumDeposit || MINIMUM_SELLER_DEPOSIT);
    setBusy(true);
    try {
      const result = await api.registerSellerContract(minimum);
      onWalletUpdated(result.data.wallet);
      Alert.alert('Đăng ký thành công', 'Hợp đồng seller đã được kích hoạt.');
    } catch (error) {
      Alert.alert('Chưa thể đăng ký seller', error instanceof Error ? error.message : 'Vui lòng thử lại');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable style={styles.backHeader} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={colors.ink} />
        <Text style={styles.backText}>Tài khoản</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Nạp tiền vào ví</Text>
      <Text style={styles.topUpIntro}>Quét QR để chuyển khoản, hoặc nạp số tiền mô phỏng để dùng thử ví trong ứng dụng.</Text>

      <View style={styles.transferCard}>
        <Text style={styles.transferTitle}>Techcombank</Text>
        <Text style={styles.transferName}>PHAM HUNG SANG</Text>
        <Text style={styles.transferAccount}>8928 9297 25</Text>
        <Image source={{ uri: TRANSFER_QR_URL }} style={styles.transferQr} resizeMode="contain" />
        <Text style={styles.transferFootnote}>QR chuyển khoản không tự xác nhận giao dịch hoặc cộng số dư.</Text>
      </View>

      <View style={styles.amountSection}>
        <Text style={styles.inputLabel}>Số tiền nạp mô phỏng</Text>
        <TextInput
          value={amount}
          onChangeText={(value) => setAmount(value.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="Nhập số tiền"
          placeholderTextColor={colors.muted}
          style={styles.walletInput}
        />
        <View style={styles.amountPresets}>
          {[5000000, 20000000, MINIMUM_SELLER_DEPOSIT].map((value) => (
            <Pressable key={value} style={styles.amountPreset} onPress={() => setAmount(String(value))}>
              <Text style={styles.amountPresetText}>{money(value)}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.topUpButton} onPress={topUp} disabled={busy}>
          <Text style={styles.topUpButtonText}>{busy ? 'Đang nạp...' : `Nạp ${money(Number(amount) || 0)}`}</Text>
        </Pressable>
      </View>

      {!contractRegistered && (
        <View style={styles.sellerCallout}>
          <Text style={styles.sellerCalloutTitle}>Bạn muốn đăng bán?</Text>
          <Text style={styles.sellerCalloutBody}>Ký quỹ tối thiểu {money(wallet?.minimumDeposit || MINIMUM_SELLER_DEPOSIT)}. Số tiền này sẽ được chuyển từ số dư ví sang tiền ký quỹ.</Text>
          <SellerContractNotice />
          <Pressable style={styles.walletActionSecondary} onPress={registerSeller} disabled={busy}>
            <Text style={styles.walletActionSecondaryText}>{busy ? 'Đang xử lý...' : 'Đăng ký hợp đồng seller'}</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function SellerProductSalesScreen({
  product,
  onBack,
  onEdit,
}: {
  product: Product;
  onBack: () => void;
  onEdit: () => void;
}) {
  const [stats, setStats] = useState<ProductSalesStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.productSales(product.id)
      .then((result) => { if (active) setStats(result.data); })
      .catch((error) => Alert.alert('Không tải được thống kê', error instanceof Error ? error.message : 'Vui lòng thử lại.'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [product.id]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable style={styles.backHeader} onPress={onBack} accessibilityRole="button">
        <Ionicons name="arrow-back" size={20} color={colors.ink} />
        <Text style={styles.backText}>Sản phẩm của bạn</Text>
      </Pressable>
      <Text style={styles.pageTitle}>{product.title}</Text>
      <Text style={styles.sellerIntro}>{money(product.price)} · Tồn kho: {product.stock ?? 0}</Text>

      <View style={styles.sellerSalesSection}>
        <Text style={styles.sectionTitle}>Kết quả bán hàng</Text>
        {loading ? <ActivityIndicator color={colors.orange} style={styles.loader} /> : stats ? (
          <>
            <View style={styles.sellerSalesRow}>
              <Text style={styles.sellerSalesLabel}>Số lượng đã bán</Text>
              <Text style={styles.sellerSalesValue}>{stats.unitsSold}</Text>
            </View>
            <View style={styles.sellerSalesRow}>
              <Text style={styles.sellerSalesLabel}>Doanh thu gộp</Text>
              <Text style={styles.sellerSalesValue}>{money(stats.grossRevenue)}</Text>
            </View>
            <View style={styles.sellerSalesRow}>
              <Text style={styles.sellerSalesLabel}>Chiết khấu nền tảng ({(stats.commissionRate * 100).toFixed(0)}%)</Text>
              <Text style={styles.sellerSalesDeduction}>−{money(stats.commission)}</Text>
            </View>
            <View style={[styles.sellerSalesRow, styles.sellerSalesTotal]}>
              <Text style={styles.sellerSalesTotalLabel}>Seller thực nhận (98%)</Text>
              <Text style={styles.sellerSalesTotalValue}>{money(stats.netRevenue)}</Text>
            </View>
            <Text style={styles.sellerSalesNote}>Tiền đơn hàng được giữ trong escrow 7 ngày trước khi chuyển vào số dư ví.</Text>
          </>
        ) : null}
      </View>
      <Button label="Chỉnh sửa sản phẩm" onPress={onEdit} secondary />
    </ScrollView>
  );
}

function SellerStudioScreen({ onBack }: { onBack: () => void }) {
  const scrollRef = useRef<ScrollView>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productType, setProductType] = useState('ebook');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [productResult, categoryResult] = await Promise.all([api.myProducts(), api.categories()]);
      setProducts(productResult.data || []);
      setCategories(categoryResult.data || []);
      setCategoryId((current) => current || categoryResult.data?.[0]?.id || '');
    } catch (error) {
      Alert.alert('Không tải được khu vực đăng bán', error instanceof Error ? error.message : 'Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setEditingProduct(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setStock('');
    setFile(null);
    setThumbnailFile(null);
  };

  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title);
    setDescription(product.description || '');
    setPrice(String(product.price));
    setStock(String(product.stock ?? 0));
    setCategoryId(product.categoryId || '');
    setProductType(product.type || 'ebook');
    setFile(null);
    setThumbnailFile(null);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const chooseFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/epub+zip', 'video/mp4'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled) setFile(result.assets[0]);
    } catch (error) {
      Alert.alert('Không chọn được file', error instanceof Error ? error.message : 'Vui lòng thử lại');
    }
  };

  const chooseThumbnail = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const selected = result.assets[0];
      if (selected.size && selected.size > 2 * 1024 * 1024) {
        Alert.alert('Ảnh quá lớn', 'Ảnh thumbnail tối đa 2 MB.');
        return;
      }
      setThumbnailFile(selected);
    } catch (error) {
      Alert.alert('Không chọn được ảnh', error instanceof Error ? error.message : 'Vui lòng thử lại');
    }
  };

  const submit = async () => {
    const priceValue = Number(price.replace(/[^0-9]/g, ''));
    const stockValue = Number(stock);
    if (!title.trim() || !description.trim() || !categoryId || (!editingProduct && !file) || !Number.isFinite(priceValue) || priceValue <= 0 || !stock.trim() || !Number.isSafeInteger(stockValue) || stockValue < 0) {
      Alert.alert('Thiếu hoặc sai thông tin', 'Nhập tên, mô tả, giá hợp lệ, danh mục, số lượng tồn hợp lệ và file sản phẩm khi tạo mới.');
      return;
    }

    setBusy(true);
    let stage: 'upload' | 'thumbnail' | 'save' = 'upload';
    try {
      let filePath = editingProduct?.fileUrl;
      let thumbnailPath = editingProduct?.thumbnail;
      if (file) {
        const uploadResult = await api.uploadProductFile(
          file.uri,
          file.name,
          file.mimeType || 'application/octet-stream',
        );
        filePath = uploadResult.data.path;
      }
      if (thumbnailFile) {
        stage = 'thumbnail';
        const thumbnailResult = await api.uploadProductThumbnail(
          thumbnailFile.uri,
          thumbnailFile.name,
          thumbnailFile.mimeType || 'image/jpeg',
        );
        thumbnailPath = thumbnailResult.data.path;
      }
      stage = 'save';
      const payload: NewProduct = {
        title: title.trim(),
        description: description.trim(),
        price: priceValue,
        stock: stockValue,
        categoryId,
        type: productType,
        fileUrl: filePath || '',
        thumbnail: thumbnailPath,
      };
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }
      const wasEditing = Boolean(editingProduct);
      resetForm();
      await load();
      Alert.alert(wasEditing ? 'Đã cập nhật sản phẩm' : 'Đã gửi sản phẩm', wasEditing ? 'Thông tin và tồn kho đã được cập nhật.' : 'Sản phẩm đang chờ admin duyệt trước khi hiển thị trên marketplace.');
    } catch (error) {
      const title = stage === 'upload'
        ? 'Không tải được file sản phẩm'
        : stage === 'thumbnail'
          ? 'Không tải được ảnh thumbnail'
          : editingProduct ? 'Không cập nhật được sản phẩm' : 'Không tạo được sản phẩm';
      Alert.alert(title, error instanceof Error ? error.message : 'Vui lòng thử lại');
    } finally {
      setBusy(false);
    }
  };

  const reviewLabel = (status?: string) => {
    if (status === 'approved') return 'Đã duyệt';
    if (status === 'rejected') return 'Bị từ chối';
    return 'Chờ admin duyệt';
  };

  if (selectedProduct) {
    return (
      <SellerProductSalesScreen
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
        onEdit={() => { editProduct(selectedProduct); setSelectedProduct(null); }}
      />
    );
  }

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.backHeader} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={colors.ink} />
        <Text style={styles.backText}>Tài khoản</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Kênh người bán</Text>
      <Text style={styles.sellerIntro}>Đăng sản phẩm số. Sản phẩm mới sẽ chỉ được công khai sau khi admin duyệt.</Text>

      <View style={styles.sellerForm}>
        <Text style={styles.sellerFormTitle}>{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm'}</Text>
        <Text style={styles.inputLabel}>Tên sản phẩm</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.walletInput} placeholder="Ví dụ: Bộ template thiết kế" placeholderTextColor={colors.muted} />

        <Text style={styles.inputLabel}>Mô tả</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.walletInput, styles.descriptionInput]}
          placeholder="Mô tả nội dung và quyền sử dụng"
          placeholderTextColor={colors.muted}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.inputLabel}>Giá bán (VND)</Text>
        <TextInput value={price} onChangeText={(value) => setPrice(value.replace(/[^0-9]/g, ''))} style={styles.walletInput} placeholder="Ví dụ: 99000" placeholderTextColor={colors.muted} keyboardType="number-pad" />

        <Text style={styles.inputLabel}>Số lượng tồn kho</Text>
        <TextInput value={stock} onChangeText={(value) => setStock(value.replace(/[^0-9]/g, ''))} style={styles.walletInput} placeholder="Ví dụ: 50" placeholderTextColor={colors.muted} keyboardType="number-pad" />

        <Text style={styles.inputLabel}>Danh mục</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sellerOptions}>
          {categories.map((category) => (
            <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.sellerOption, categoryId === category.id && styles.sellerOptionActive]}>
              <Text style={[styles.sellerOptionText, categoryId === category.id && styles.sellerOptionTextActive]}>{category.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.inputLabel}>Loại sản phẩm</Text>
        <View style={styles.sellerOptions}>
          {['ebook', 'template', 'video'].map((type) => (
            <Pressable key={type} onPress={() => setProductType(type)} style={[styles.sellerOption, productType === type && styles.sellerOptionActive]}>
              <Text style={[styles.sellerOptionText, productType === type && styles.sellerOptionTextActive]}>{type === 'ebook' ? 'Ebook' : type === 'template' ? 'Template' : 'Video'}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.thumbnailPicker} onPress={chooseThumbnail}>
          {thumbnailFile ? (
            <Image source={{ uri: thumbnailFile.uri }} style={styles.thumbnailPreview} />
          ) : editingProduct?.thumbnail ? (
            <Image source={{ uri: mediaUrl(editingProduct.thumbnail) }} style={styles.thumbnailPreview} />
          ) : (
            <Ionicons name="image-outline" size={22} color={colors.ink} />
          )}
          <Text style={styles.filePickerText}>{thumbnailFile?.name || (editingProduct?.thumbnail ? 'Giữ ảnh thumbnail hiện tại hoặc chọn ảnh mới' : 'Chọn ảnh thumbnail JPG hoặc PNG (tối đa 2 MB)')}</Text>
        </Pressable>
        <Pressable style={styles.filePicker} onPress={chooseFile}>
          <Ionicons name="document-attach-outline" size={20} color={colors.ink} />
          <Text style={styles.filePickerText}>{file?.name || (editingProduct?.fileUrl ? 'Giữ file sản phẩm hiện tại hoặc chọn file mới' : 'Chọn file PDF, EPUB hoặc MP4')}</Text>
        </Pressable>
        <Pressable style={styles.topUpButton} onPress={submit} disabled={busy}>
          <Text style={styles.topUpButtonText}>{busy ? 'Đang lưu...' : editingProduct ? 'Lưu thay đổi' : 'Gửi admin duyệt'}</Text>
        </Pressable>
        {editingProduct && <Button label="Hủy chỉnh sửa" onPress={resetForm} secondary />}
      </View>

      <View style={styles.sellerListHeader}>
        <Text style={styles.sectionTitle}>Sản phẩm của bạn</Text>
        <Pressable onPress={() => void load()} accessibilityLabel="Tải lại sản phẩm">
          <Ionicons name="refresh-outline" size={20} color={colors.ink} />
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.orange} style={styles.loader} />
      ) : products.length === 0 ? (
        <Text style={styles.emptyText}>Bạn chưa đăng sản phẩm nào.</Text>
      ) : products.map((product) => (
        <View key={product.id} style={styles.sellerProductRow}>
          <Pressable style={styles.sellerProductInfo} onPress={() => setSelectedProduct(product)}>
            <Text style={styles.productTitle}>{product.title}</Text>
            <Text style={styles.productMeta}>{money(product.price)} · {product.type || 'Sản phẩm số'}</Text>
            <Text style={styles.productMeta}>Tồn kho: {product.stock ?? 0}</Text>
          </Pressable>
          <View style={styles.sellerProductActions}>
            <Text style={[styles.contractStatus, product.reviewStatus === 'approved' && styles.contractStatusActive, product.reviewStatus === 'rejected' && styles.sellerRejected]}>
              {reviewLabel(product.reviewStatus)}
            </Text>
            <Pressable style={styles.sellerEditButton} onPress={() => editProduct(product)} accessibilityLabel={`Chỉnh sửa ${product.title}`}>
              <Ionicons name="create-outline" size={16} color={colors.ink} />
              <Text style={styles.sellerEditButtonText}>Chỉnh sửa</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function MarketplaceApp() {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [tab, setTab] = useState<TabKey>('home');
  const [screen, setScreen] = useState<ScreenKey>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pendingOrder, setPendingOrder] = useState<{ id: string; totalAmount: number } | null>(null);
  const [topUpReturnScreen, setTopUpReturnScreen] = useState<'profile' | 'paymentRequired'>('profile');
  const [pendingChat, setPendingChat] = useState<{ participantId: string; productId: string } | null>(null);
  const [chatThreadOpen, setChatThreadOpen] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [appStep, setAppStep] = useState<'welcome' | 'auth' | 'app'>('app');

  const reloadCart = async () => {
    try {
      setCartLoading(true);
      const result = await api.cart();
      setCart(result.data || null);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Không tải được giỏ hàng', error.message);
      }
      setCart(null);
    } finally {
      setCartLoading(false);
    }
  };

  const reloadWallet = async (walletResponse?: Wallet) => {
    if (walletResponse) {
      setWallet(walletResponse);
      return;
    }
    try {
      const result = await api.walletSummary();
      setWallet(result.data || null);
    } catch {
      setWallet(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const active = await hasSession();
        if (active) {
          const profile = await api.me();
          setUser(profile.data);
          setAppStep('app');
          await reloadWallet();
        } else {
          setAppStep('app');
        }
      } catch {
        setUser(null);
        setAppStep('app');
      } finally {
        setReady(true);
      }
    };
    void init();
  }, []);

  useEffect(() => {
    if (user) {
      void reloadCart();
      void reloadWallet();
    }
  }, [user]);

  const handleAddToCart = async (product: Product) => {
    try {
      await api.addToCart(product.id);
      Alert.alert('Đã thêm vào giỏ', product.title);
      await reloadCart();
    } catch (error) {
      Alert.alert('Chưa thể thêm vào giỏ', error instanceof Error ? error.message : 'Vui lòng thử lại');
    }
  };

  const finishPaidOrder = async (orderId: string) => {
    await reloadWallet();
    await reloadCart();
    setPendingOrder(null);
    Alert.alert('Đặt hàng thành công', `Mã đơn: ${orderId}`);
    setTab('orders');
    setScreen('orders');
  };

  const handleCheckout = async () => {
    try {
      const checkoutResult = await api.checkout();
      const paymentResult = await api.createPayment(checkoutResult.data.orderId, 'mock');
      if (paymentResult.data.status !== 'success') {
        setPendingOrder({
          id: checkoutResult.data.orderId,
          totalAmount: Number(paymentResult.data.requiredAmount || checkoutResult.data.totalAmount),
        });
        await reloadWallet();
        setScreen('paymentRequired');
        return;
      }
      await finishPaidOrder(checkoutResult.data.orderId);
    } catch (error) {
      Alert.alert('Chưa thể thanh toán', error instanceof Error ? error.message : 'Vui lòng thử lại');
    }
  };

  const retryPendingPayment = async () => {
    if (!pendingOrder) return;
    try {
      const result = await api.createPayment(pendingOrder.id, 'wallet');
      if (result.data.status !== 'success') {
        await reloadWallet();
        Alert.alert('Ví vẫn chưa đủ', 'Hãy nạp thêm tiền rồi thử lại.');
        return;
      }
      await finishPaidOrder(pendingOrder.id);
    } catch (error) {
      Alert.alert('Chưa thể thanh toán', error instanceof Error ? error.message : 'Vui lòng thử lại');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await api.removeFromCart(itemId);
      await reloadCart();
    } catch (error) {
      Alert.alert('Không xóa được', error instanceof Error ? error.message : 'Vui lòng thử lại');
    }
  };

  const handleOpenSupport = async () => {
    try {
      const result = await api.chatContacts();
      const admin = result.data.find((contact) => contact.user.role === 'admin');
      if (!admin) {
        Alert.alert('Chưa có tài khoản Admin', 'Hệ thống chưa có tài khoản quản trị để nhận tin nhắn.');
        return;
      }
      setPendingChat({ participantId: admin.user.id, productId: '' });
      setTab('chat');
      setScreen('chat');
    } catch (error) {
      Alert.alert('Không mở được hỗ trợ', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setCart(null);
      setWallet(null);
      setPendingOrder(null);
      setScreen('home');
      setTab('home');
      setChatThreadOpen(false);
      await SecureStore.deleteItemAsync(GUEST_HOME_KEY);
    }
  };

  if (!ready) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  }

  if (!user && appStep === 'welcome') {
    return (
      <WelcomeScreen
        onScan={async () => {
          await SecureStore.setItemAsync(GUEST_HOME_KEY, 'true');
          setAppStep('app');
        }}
        onLater={() => setAppStep('auth')}
      />
    );
  }

  if (!user && appStep === 'auth') {
    return <Auth onLogin={setUser} />;
  }

  if (!user && appStep === 'app') {
    return (
      <SafeAreaView style={styles.app}>
        <StatusBar style="dark" />
        <HomeScreen
          onOpenProduct={(product) => {
            Alert.alert('Vui lòng đăng nhập', 'Hãy đăng nhập để mua sản phẩm.');
          }}
          onAddToCart={(product) => {
            Alert.alert('Vui lòng đăng nhập', `Đăng nhập để thêm ${product.title} vào giỏ.`);
          }}
        />
        <View style={styles.guestActionWrap}>
          <Button label="Đăng nhập" onPress={() => setAppStep('auth')} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return <View style={styles.centerBox}><ActivityIndicator color={colors.orange} /></View>;
  }

  let content: React.ReactNode;

  if (screen === 'detail' && selectedProduct) {
    content = <ProductDetailScreen product={selectedProduct} userId={user.id} onAddToCart={handleAddToCart} onChat={(participantId, productId) => { setPendingChat({ participantId, productId }); setTab('chat'); setScreen('chat'); }} onBack={() => setScreen(tab)} />;
  } else if (screen === 'chat') {
    content = <ChatScreen userId={user.id} initialContact={pendingChat} onInitialHandled={() => setPendingChat(null)} onThreadChange={setChatThreadOpen} />;
  } else if (screen === 'seller') {
    content = <SellerStudioScreen onBack={() => setScreen('profile')} />;
  } else if (screen === 'topup') {
    content = (
      <WalletTopUpScreen
        wallet={wallet}
        onWalletUpdated={setWallet}
        initialAmount={topUpReturnScreen === 'paymentRequired' && pendingOrder ? Math.max(1, pendingOrder.totalAmount - Number(wallet?.balance || 0)) : undefined}
        onBack={() => setScreen(topUpReturnScreen)}
      />
    );
  } else if (screen === 'withdrawal') {
    content = <WithdrawalScreen wallet={wallet} onWalletUpdated={setWallet} onBack={() => setScreen('profile')} />;
  } else if (screen === 'paymentRequired' && pendingOrder) {
    content = (
      <PaymentRequiredScreen
        totalAmount={pendingOrder.totalAmount}
        walletBalance={Number(wallet?.balance || 0)}
        onTopUp={() => { setTopUpReturnScreen('paymentRequired'); setScreen('topup'); }}
        onRetry={retryPendingPayment}
      />
    );
  } else if (screen === 'cart') {
    content = (
      <CartScreen
        cart={cart}
        loading={cartLoading}
        onRefresh={reloadCart}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => setScreen('checkout')}
      />
    );
  } else if (screen === 'checkout') {
    content = <CheckoutScreen cart={cart} onBack={() => setScreen('cart')} onConfirm={handleCheckout} />;
  } else if (screen === 'orders') {
    content = <OrdersScreen />;
  } else if (screen === 'library') {
    content = <LibraryScreen />;
  } else if (screen === 'profile') {
    content = (
      <ProfileScreen
        user={user}
        wallet={wallet}
        onWalletChanged={reloadWallet}
        onOpenTopUp={() => { setTopUpReturnScreen('profile'); setScreen('topup'); }}
        onOpenWithdrawal={() => setScreen('withdrawal')}
        onOpenSeller={() => setScreen('seller')}
        onOpenSupport={handleOpenSupport}
        onLogout={handleLogout}
      />
    );
  } else {
    content = <HomeScreen onOpenProduct={(product) => { setSelectedProduct(product); setScreen('detail'); }} onAddToCart={handleAddToCart} />;
  }

  const navItems: Array<{ key: TabKey; icon: any; label: string }> = [
    { key: 'home', icon: 'compass-outline', label: 'Khám phá' },
    { key: 'cart', icon: 'bag-handle-outline', label: 'Giỏ hàng' },
    { key: 'orders', icon: 'receipt-outline', label: 'Đơn hàng' },
    { key: 'library', icon: 'library-outline', label: 'Thư viện' },
    { key: 'chat', icon: 'chatbubble-ellipses-outline', label: 'Tin nhắn' },
    { key: 'profile', icon: 'person-outline', label: 'Tài khoản' },
  ];

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar style="dark" />
      {content}
      {!(screen === 'chat' && chatThreadOpen) ? (
        <View style={styles.navBar}>
          {navItems.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => {
                setTab(item.key);
                setScreen(item.key);
              }}
              style={styles.navItem}
            >
              <Ionicons name={item.icon} size={22} color={tab === item.key ? colors.orange : colors.muted} />
              <Text numberOfLines={1} style={[styles.navLabel, tab === item.key && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <MarketplaceApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  pageScroll: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    padding: 20,
    paddingBottom: 110,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  welcomeScreen: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 18,
    backgroundColor: '#d4d1cb',
    justifyContent: 'flex-start',
  },
  welcomeContent: {
    paddingBottom: 28,
  },
  auth: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 18,
    backgroundColor: '#d4d1cb',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statusTime: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    width: 72,
  },
  statusCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  signalBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1d1d1d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  signalBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  signalBar: {
    width: 130,
    height: 12,
    borderRadius: 12,
    backgroundColor: '#5a5a5a',
    position: 'relative',
    overflow: 'hidden',
  },
  signalBarActive: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '68%',
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 110,
  },
  statusWiFi: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
  },
  batteryBox: {
    width: 28,
    height: 15,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#1f1f1f',
    justifyContent: 'center',
    padding: 2,
  },
  batteryFill: {
    width: '70%',
    height: '100%',
    backgroundColor: '#1f1f1f',
    borderRadius: 2,
  },
  authHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 26,
  },
  brandMark: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: '#1d1d1d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: {
    color: '#dfe7db',
    fontSize: 42,
    fontWeight: '700',
  },
  settingButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#b3b0ab',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  eyebrow: {
    color: '#b95d3a',
    fontSize: 18,
    letterSpacing: 1.6,
    fontWeight: '800',
    marginTop: 6,
  },
  authTitle: {
    color: colors.ink,
    fontSize: 52,
    lineHeight: 54,
    fontWeight: '800',
    marginTop: 18,
  },
  authCopy: {
    marginTop: 12,
    marginBottom: 30,
    color: colors.muted,
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 460,
  },
  authCard: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(28,28,27,0.08)',
  },
  inputWrap: {
    marginTop: 12,
  },
  inputLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: '#8d8a86',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.55)',
    color: colors.ink,
    fontSize: 18,
    paddingHorizontal: 14,
  },
  primaryButton: {
    backgroundColor: '#1c1c1b',
    minHeight: 68,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    marginBottom: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 20,
  },
  qrCard: {
    backgroundColor: 'rgba(255,255,255,0.38)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(28,28,27,0.1)',
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
  qrCodeBox: {
    width: 126,
    height: 126,
    borderRadius: 22,
    backgroundColor: '#1e1e1e',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPattern: {
    width: 80,
    height: 80,
    borderWidth: 7,
    borderColor: '#dfe7db',
    borderRadius: 16,
    position: 'absolute',
  },
  qrPatternSmall: {
    width: 18,
    height: 18,
    backgroundColor: '#dfe7db',
    position: 'absolute',
    left: 18,
    top: 18,
    borderRadius: 6,
  },
  qrPatternTiny: {
    width: 12,
    height: 12,
    backgroundColor: '#dfe7db',
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 4,
  },
  qrTitle: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 26,
    marginTop: 18,
  },
  qrSubtitle: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 15,
    marginTop: 8,
    maxWidth: 260,
  },
  secondaryAction: {
    backgroundColor: '#1c1c1b',
    minHeight: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryActionText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 18,
  },
  button: {
    backgroundColor: colors.ink,
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.ink,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 15,
  },
  buttonTextSecondary: {
    color: colors.ink,
  },
  switchText: {
    textAlign: 'center',
    color: colors.ink,
    fontWeight: '700',
    marginTop: 22,
  },
  guestActionWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
  },
  loader: {
    marginVertical: 26,
  },
  heroCard: {
    minHeight: 260,
    backgroundColor: colors.ink,
    borderRadius: 24,
    padding: 22,
    overflow: 'hidden',
    marginBottom: 18,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800',
    marginTop: 12,
  },
  heroCopy: {
    color: colors.mint,
    marginTop: 16,
    maxWidth: 220,
    lineHeight: 21,
  },
  heroOrb: {
    position: 'absolute',
    right: -18,
    bottom: -26,
    width: 170,
    height: 170,
    borderRadius: 90,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
  },
  orbText: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 18,
    lineHeight: 20,
    textAlign: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    paddingVertical: 6,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  pageTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionLink: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  chipWrap: {
    marginBottom: 16,
  },
  chip: {
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipText: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 8,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  productImageWrap: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.soft,
    marginBottom: 10,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fakeThumb: {
    flex: 1,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fakeThumbText: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 20,
  },
  productTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  productMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  price: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 15,
  },
  smallBtn: {
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  smallBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  cartRow: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cartThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mint,
    marginRight: 12,
  },
  cartTextWrap: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14,
  },
  totalLabel: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 14,
  },
  totalPrice: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: colors.muted,
    marginTop: 12,
    fontSize: 15,
    fontWeight: '700',
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 14,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderId: {
    color: colors.ink,
    fontWeight: '800',
  },
  orderStatus: {
    color: colors.orange,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderItemText: {
    color: colors.ink,
    flex: 1,
  },
  orderItemMeta: {
    color: colors.muted,
  },
  libraryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  libraryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  libraryTextWrap: {
    flex: 1,
  },
  libraryOpen: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.ink,
  },
  libraryOpenText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    padding: 18,
    marginBottom: 18,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  profileName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  walletCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    marginBottom: 18,
  },
  topUpIntro: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  transferCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    marginBottom: 18,
  },
  checkoutItems: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 16,
  },
  checkoutSectionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  checkoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  checkoutItemInfo: {
    flex: 1,
  },
  checkoutItemPrice: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  checkoutButtonDisabled: {
    opacity: 0.5,
  },
  paymentRequiredHeader: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 20,
  },
  paymentRequiredCopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },
  paymentAmounts: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 16,
  },
  paymentAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
  },
  shortfallRow: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 4,
    paddingTop: 13,
  },
  shortfallLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  shortfallValue: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  paymentRetry: {
    marginTop: 10,
  },
  withdrawalForm: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  withdrawAllButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  withdrawAllButtonActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  withdrawAllText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  withdrawAllTextActive: {
    color: colors.white,
  },
  withdrawalRequestRow: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  withdrawalRequestHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  withdrawalStatus: {
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '800',
  },
  withdrawalApproved: {
    color: '#24704C',
    backgroundColor: '#E2F3E9',
  },
  withdrawalRejected: {
    color: '#A13D34',
    backgroundColor: '#FBE8E5',
  },
  withdrawalPending: {
    color: '#8A5B16',
    backgroundColor: '#FFF1D6',
  },
  withdrawalNote: {
    color: colors.ink,
    fontSize: 12,
    marginTop: 8,
  },
  withdrawalDate: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 7,
  },
  transferTitle: {
    color: '#d72332',
    fontSize: 17,
    fontWeight: '800',
  },
  transferName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  transferAccount: {
    color: colors.ink,
    fontSize: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  transferQr: {
    width: 250,
    height: 250,
    maxWidth: '100%',
    backgroundColor: '#fff',
  },
  transferFootnote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 12,
  },
  amountSection: {
    marginBottom: 18,
  },
  amountPresets: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  amountPreset: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 4,
  },
  amountPresetText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  topUpButton: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    marginTop: 14,
  },
  topUpButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  sellerCallout: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 18,
    marginTop: 4,
  },
  sellerCalloutTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  sellerCalloutBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  sellerEntryButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.mint,
    borderRadius: 12,
    marginTop: 10,
  },
  sellerEntryText: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 13,
  },
  sellerContractNotice: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 12,
    paddingTop: 12,
  },
  sellerContractButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  sellerContractButtonText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  sellerContractText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  sellerSalesSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  sellerSalesRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  sellerSalesLabel: {
    flex: 1,
    color: colors.muted,
    fontSize: 14,
  },
  sellerSalesValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  sellerSalesDeduction: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  sellerSalesTotal: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  sellerSalesTotalLabel: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  sellerSalesTotalValue: {
    color: colors.orange,
    fontSize: 18,
    fontWeight: '800',
  },
  sellerSalesNote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  sellerIntro: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  sellerForm: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
  },
  sellerFormTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  descriptionInput: {
    minHeight: 92,
    paddingTop: 12,
  },
  sellerOptions: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  sellerOption: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.soft,
  },
  sellerOptionActive: {
    borderColor: colors.ink,
    backgroundColor: colors.mint,
  },
  sellerOptionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  sellerOptionTextActive: {
    color: colors.ink,
  },
  filePicker: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.muted,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  thumbnailPicker: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.muted,
    borderRadius: 12,
    padding: 8,
    marginTop: 14,
  },
  thumbnailPreview: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: colors.soft,
  },
  filePickerText: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  sellerListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sellerProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  sellerProductInfo: {
    flex: 1,
  },
  sellerProductActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  sellerEditButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    paddingHorizontal: 9,
  },
  sellerEditButtonText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  sellerRejected: {
    color: colors.danger,
  },
  walletBalance: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 10,
  },
  walletStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  walletStatBox: {
    flex: 1,
    backgroundColor: colors.soft,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
  },
  walletStatLabel: {
    color: colors.muted,
    fontSize: 11,
    marginBottom: 8,
  },
  walletStatValue: {
    color: colors.ink,
    fontWeight: '800',
  },
  contractStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  contractStatus: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '800',
  },
  contractStatusActive: {
    color: '#3c8060',
  },
  contractHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  walletInput: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    color: colors.ink,
    backgroundColor: colors.soft,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  walletActionPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  walletActionPrimaryText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
  walletActionSecondary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  walletActionSecondaryText: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 12,
  },
  settingsBlock: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  settingText: {
    color: colors.ink,
    fontWeight: '700',
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
  },
  backText: {
    color: colors.ink,
    fontWeight: '700',
    marginLeft: 8,
  },
  detailImageWrap: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 18,
  },
  detailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailPlaceholder: {
    flex: 1,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: {
    marginTop: 12,
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  priceLarge: {
    marginTop: 12,
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  detailMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 18,
  },
  detailBody: {
    color: colors.muted,
    lineHeight: 22,
    fontSize: 15,
    marginTop: 10,
    marginBottom: 18,
  },
  detailActions: {
    marginTop: 8,
  },
  reportSection: {
    marginTop: 12,
  },
  reportAction: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
  },
  reportActionText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewSection: {
    marginTop: 28,
  },
  reviewSummary: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  reviewForm: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  ratingPicker: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  reviewInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    color: colors.ink,
    backgroundColor: colors.soft,
    fontSize: 14,
  },
  reviewSubmit: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 10,
    backgroundColor: colors.ink,
    borderRadius: 10,
  },
  reviewSubmitText: {
    color: colors.white,
    fontWeight: '700',
  },
  reviewHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  reviewItem: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  reviewAuthor: {
    flex: 1,
    color: colors.ink,
    fontWeight: '700',
  },
  reviewDate: {
    color: colors.muted,
    fontSize: 11,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 5,
  },
  reviewContent: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  navBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  navLabelActive: {
    color: colors.orange,
  },
});

export default App;
