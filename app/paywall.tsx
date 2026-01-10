import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Dimensions,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, Sparkles, Zap, Cloud, ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PlanType = 'basic' | 'super';
type BillingCycle = 'monthly' | 'yearly';

export default function PaywallScreen() {
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState<PlanType>('super');
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleTogglePlan = (plan: PlanType) => {
        Haptics.selectionAsync();
        setSelectedPlan(plan);
    };

    const handleToggleBilling = (cycle: BillingCycle) => {
        Haptics.selectionAsync();
        setBillingCycle(cycle);
    };

    const handleSubscribe = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log(`Subscribing to ${selectedPlan} plan, ${billingCycle} billing`);
    };

    const handleRestore = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        console.log('Restore subscription');
    };

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#E0C3FC', '#F4F1FD', '#FFFFFF']}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.6 }}
            />

            {/* Mesh/Blob decoration (simulated with absolute views and gradients) can be added here if needed for more detail */}
            <View style={styles.blob1} />
            <View style={styles.blob2} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={styles.tagContainer}>
                        <Text style={styles.tagText}>Highlight</Text>
                    </View>
                    <Pressable onPress={handleClose} style={[styles.closeButton, { backgroundColor: '#fff' }]}>
                        <ChevronLeft size={24} color="#000" strokeWidth={1.5} />
                    </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                    <Text style={styles.title}>
                        Unlock your{'\n'}
                        <Text style={styles.highlightText}>Pro</Text>ductivity
                    </Text>

                    {/* Plan Toggle */}
                    <View style={styles.toggleContainer}>
                        <Pressable
                            style={[styles.toggleButton, selectedPlan === 'basic' && styles.toggleButtonActive]}
                            onPress={() => handleTogglePlan('basic')}
                        >
                            <Text style={[styles.toggleText, selectedPlan === 'basic' && styles.toggleTextActive]}>
                                Basic plan
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[styles.toggleButton, selectedPlan === 'super' && styles.toggleButtonActive]}
                            onPress={() => handleTogglePlan('super')}
                        >
                            <Text style={[styles.toggleText, selectedPlan === 'super' && styles.toggleTextActive]}>
                                Super plan
                            </Text>
                        </Pressable>
                    </View>

                    {/* Features List */}
                    <View style={styles.featuresContainer}>
                        <FeatureItem
                            icon={<Check size={20} color="#5856D6" />}
                            text="Unlimited lists and sublists (with team and guests)"
                        />
                        <FeatureItem
                            icon={<Sparkles size={20} color="#5856D6" />}
                            text="Talk your task with Voice AI"
                        />
                        <FeatureItem
                            icon={<Check size={20} color="#5856D6" />}
                            text="Access to all integrations"
                        />
                        <FeatureItem
                            icon={<Check size={20} color="#5856D6" />}
                            text="100MB uploads & 25GB storage"
                        />
                    </View>

                    {/* Decorative Signature/Scribble */}
                    <View style={styles.scribbleContainer}>
                        {/* Simple SVG or Image would go here, using a placeholders view for now */}
                        <View style={styles.scribbleLine} />
                    </View>

                    <Text style={styles.moreInfoText}>
                        Looking for more? If you need more features check our Super plan.
                    </Text>

                    {/* Pricing Cards */}
                    <View style={styles.pricingContainer}>
                        <Pressable
                            style={[
                                styles.pricingCard,
                                billingCycle === 'monthly' && styles.pricingCardActive
                            ]}
                            onPress={() => handleToggleBilling('monthly')}
                        >
                            <View style={styles.pricingHeader}>
                                <Text style={styles.pricingPeriod}>Monthly</Text>
                                {billingCycle === 'monthly' && (
                                    <View style={styles.checkCircle}>
                                        {/* No check for monthly usually unless selected, but design shows check only on yearly, lets follow design logic roughly */}
                                    </View>
                                )}
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceAmount}>$6</Text>
                                <Text style={styles.priceSuffix}>/month</Text>
                            </View>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.pricingCard,
                                billingCycle === 'yearly' && styles.pricingCardActive,
                                styles.pricingCardYearly
                            ]}
                            onPress={() => handleToggleBilling('yearly')}
                        >
                            <View style={styles.pricingHeader}>
                                <Text style={styles.pricingPeriod}>Yearly <Text style={styles.discountText}>-18%</Text></Text>
                                {billingCycle === 'yearly' && (
                                    <View style={styles.checkCircleActive}>
                                        <Check size={12} color="#fff" strokeWidth={4} />
                                    </View>
                                )}
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceAmount}>$59</Text>
                                <Text style={styles.priceSuffix}>/year</Text>
                            </View>
                        </Pressable>
                    </View>

                    {/* CTA Button */}
                    <Pressable style={styles.ctaButton} onPress={handleSubscribe}>
                        <Text style={styles.ctaText}>Start 7-day trial</Text>
                    </Pressable>

                    <Pressable onPress={handleRestore}>
                        <Text style={styles.restoreText}>Restore subscription</Text>
                    </Pressable>

                    <Text style={styles.legalText}>
                        Privacy Policy • Terms of Service
                    </Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <View style={styles.featureItem}>
            <View style={styles.featureIcon}>{icon}</View>
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    backgroundGradient: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.6,
    },
    blob1: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#FFD6FF',
        opacity: 0.4,
    },
    blob2: {
        position: 'absolute',
        top: 50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#E7CCFF',
        opacity: 0.4,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    tagContainer: {
        backgroundColor: '#A09CB0', // Muted purple/grey
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 20,
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 42,
        fontWeight: '800',
        color: '#1C1C1E',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 30,
        lineHeight: 48,
        letterSpacing: -1,
    },
    highlightText: {
        color: '#5856D6',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 30,
        padding: 4,
        marginBottom: 30,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    toggleButton: {
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 26,
    },
    toggleButtonActive: {
        backgroundColor: '#F5F0F0',
    },
    toggleText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8E8E93',
    },
    toggleTextActive: {
        color: '#1C1C1E',
    },
    featuresContainer: {
        gap: 16,
        marginBottom: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureIcon: {
        width: 24,
        alignItems: 'center',
    },
    featureText: {
        fontSize: 16,
        color: '#1C1C1E',
        fontWeight: '500',
        flex: 1,
        lineHeight: 22,
    },
    scribbleContainer: {
        height: 20,
        justifyContent: 'center',
        marginBottom: 10,
        overflow: 'hidden',
    },
    scribbleLine: {
        height: 2,
        backgroundColor: '#E0E0E0',
        width: '60%',
        alignSelf: 'flex-start',
        borderRadius: 2,
    },
    moreInfoText: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 24,
        lineHeight: 20,
    },
    pricingContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
        backgroundColor: '#F2F2F7',
        padding: 16,
        borderRadius: 24,
    },
    pricingCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 20,
        padding: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    pricingCardYearly: {
        backgroundColor: 'rgba(216, 216, 255, 0.3)', // Light bluish tint
        borderColor: '#5856D6',
    },
    pricingCardActive: {
        // Active state styling if different, but here yearly is pre-selected and highlighted
    },
    pricingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    pricingPeriod: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    discountText: {
        color: '#5856D6',
    },
    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#C7C7CC',
    },
    checkCircleActive: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#34C759', // Success green
        alignItems: 'center',
        justifyContent: 'center',
    },
    priceRow: {
        marginTop: 4,
    },
    priceAmount: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1C1C1E',
    },
    priceSuffix: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '500',
    },
    ctaButton: {
        backgroundColor: '#5856D6',
        borderRadius: 30,
        paddingVertical: 18,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#5856D6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    ctaText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    restoreText: {
        textAlign: 'center',
        color: '#8E8E93',
        fontWeight: '600',
        fontSize: 15,
        marginBottom: 12,
    },
    legalText: {
        textAlign: 'center',
        color: '#C7C7CC',
        fontSize: 12,
    },
});
