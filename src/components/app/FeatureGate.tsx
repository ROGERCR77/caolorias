import { ReactNode, useState } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { UpgradeModal } from "./UpgradeModal";
import { Button } from "@/components/ui/button";
import { Lock, Crown } from "lucide-react";

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

interface FeatureGateBlurProps {
  feature: string;
  children: ReactNode;
  overlayText: string;
}

export function FeatureGateBlur({ feature, children, overlayText }: FeatureGateBlurProps) {
  const { canAccessFeature } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (canAccessFeature(feature)) return <>{children}</>;

  return (
    <div className="relative">
      <div className="filter blur-[3px] pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 rounded-lg">
        <Lock className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-center font-medium px-4">{overlayText}</p>
        <Button size="sm" variant="outline" className="mt-2 gap-1" onClick={() => setShowUpgrade(true)}>
          <Crown className="w-3 h-3 text-warning" /> Ver planos
        </Button>
      </div>
      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} feature={feature} />
    </div>
  );
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
  const { canAccessFeature } = useSubscription();
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
