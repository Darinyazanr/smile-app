/**
 * BottomSheet 通用底部弹出组件
 *
 * 使用场景：打卡录入弹窗、日历详情弹窗等
 *
 * 用法：
 * ```
 * <BottomSheet visible={visible} onClose={handleClose}>
 *   <BottomSheet.Header>
 *     <BottomSheet.Title>标题</BottomSheet.Title>
 *   </BottomSheet.Header>
 *   <BottomSheet.Body>
 *     {/* 内容 *-/}
 *   </BottomSheet.Body>
 *   <BottomSheet.Footer>
 *     {/* 底部按钮 *-/}
 *   </BottomSheet.Footer>
 * </BottomSheet>
 * ```
 */
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** 弹窗最大高度占比，默认 80% */
  maxHeight?: string;
  /** 是否显示拖拽手柄，默认 true */
  showHandle?: boolean;
  /** 自定义容器样式 */
  contentStyle?: StyleProp<ViewStyle>;
}

function BottomSheet({
  visible,
  onClose,
  children,
  maxHeight = '80%',
  showHandle = true,
  contentStyle,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.content,
            { maxHeight, paddingBottom: insets.bottom + 20 },
            contentStyle,
          ]}
        >
          {showHandle && <View style={styles.handle} />}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---- 子组件 ----

interface HeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
}

function Header({ children, onClose, showCloseButton = true }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTitle}>{children}</View>
      {showCloseButton && onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#64748B" />
        </TouchableOpacity>
      )}
    </View>
  );
}

interface TitleProps {
  children: React.ReactNode;
}

function Title({ children }: TitleProps) {
  return <Text style={styles.title}>{children}</Text>;
}

interface BodyProps {
  children: React.ReactNode;
}

function Body({ children }: BodyProps) {
  return <View style={styles.body}>{children}</View>;
}

interface FooterProps {
  children: React.ReactNode;
}

function Footer({ children }: FooterProps) {
  return <View style={styles.footer}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
});

// 组合导出
BottomSheet.Header = Header;
BottomSheet.Title = Title;
BottomSheet.Body = Body;
BottomSheet.Footer = Footer;

export { BottomSheet };
export default BottomSheet;
