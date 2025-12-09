import { ReactNode } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { UpgradeModal } from "./UpgradeModal";
import { useState } from "react";

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradeOnBlock?: boolean;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showUpgradeOnBlock = true 
}: FeatureGateProps) {
  const { canAccessFeature } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (canAccessFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradeOnBlock) {
    return (
      <>
        <div 
          onClick={() => setShowUpgrade(true)}
          className="cursor-pointer"
        >
          {children}
        </div>
        <UpgradeModal 
          open={showUpgrade} 
          onOpenChange={setShowUpgrade}
          feature={feature}
        />
      </>
    );
  }

  return null;
}

interface FeatureGateButtonProps {
  feature: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function FeatureGateButton({
  feature,
  children,
  onClick,
  className,
}: FeatureGateButtonProps) {
  const { canAccessFeature, isPremium } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleClick = () => {
    if (canAccessFeature(feature)) {
      onClick?.();
    } else {
      setShowUpgrade(true);
    }
  };

  return (
    <>
      <div onClick={handleClick} className={className}>
        {children}
      </div>
      <UpgradeModal 
        open={showUpgrade} 
        onOpenChange={setShowUpgrade}
        feature={feature}
      />
    </>
  );
}
