import { valueToBigNumber } from '@aave/math-utils';
import { ArrowNarrowRightIcon } from '@heroicons/react/solid';
import { Trans } from '@lingui/macro';
import { Box, Skeleton, SvgIcon } from '@mui/material';
import React from 'react';
import { GhoIncentivesCard } from 'src/components/incentives/GhoIncentivesCard';
import { FormattedNumber } from 'src/components/primitives/FormattedNumber';
import { ROUTES } from 'src/components/primitives/Link';
import { Row } from 'src/components/primitives/Row';
import { TokenIcon } from 'src/components/primitives/TokenIcon';
import { DetailsIncentivesLine } from 'src/components/transactions/FlowCommons/TxModalDetails';
import { CustomMarket } from 'src/ui-config/marketsConfig';
import { displayGhoForMintableMarket, weightedAverageAPY } from 'src/utils/ghoUtilities';

import { ComputedUserReserveData } from '../../../hooks/app-data-provider/useAppDataProvider';
import { GhoRange } from './DebtSwitchModalContent';

export type DebtSwitchModalDetailsProps = {
  switchSource: ComputedUserReserveData;
  switchTarget: ComputedUserReserveData;
  toAmount: string;
  fromAmount: string;
  loading: boolean;
  sourceBalance: string;
  sourceBorrowAPY: string;
  targetBorrowAPY: string;
  ghoData?: GhoRange;
  currentMarket: CustomMarket;
};
const ArrowRightIcon = (
  <SvgIcon color="primary" sx={{ fontSize: '14px', mx: 1 }}>
    <ArrowNarrowRightIcon />
  </SvgIcon>
);

export const DebtSwitchModalDetails = ({
  switchSource,
  switchTarget,
  toAmount,
  fromAmount,
  loading,
  sourceBalance,
  sourceBorrowAPY,
  targetBorrowAPY,
  ghoData,
  currentMarket,
}: DebtSwitchModalDetailsProps) => {
  // if there is an inputAmount + GHO -> re-calculate max
  const sourceAmountAfterSwap = valueToBigNumber(sourceBalance).minus(valueToBigNumber(fromAmount));

  const targetAmountAfterSwap = valueToBigNumber(switchTarget.variableBorrows).plus(
    valueToBigNumber(toAmount)
  );

  const skeleton: JSX.Element = (
    <>
      <Skeleton variant="rectangular" height={20} width={100} sx={{ borderRadius: '4px' }} />
      <Skeleton
        variant="rectangular"
        height={15}
        width={80}
        sx={{ borderRadius: '4px', marginTop: '4px' }}
      />
    </>
  );

  let switchToApy = 0;
  let switchToRange = ghoData?.ghoApyRange;
  if (switchTarget.reserve.symbol === 'GHO' && ghoData) {
    switchToApy = weightedAverageAPY(
      ghoData.ghoVariableBorrowApy,
      ghoData.userCurrentBorrowBalance + ghoData.inputAmount,
      ghoData.userGhoAvailableToBorrowAtDiscount,
      ghoData.ghoBorrowAPYWithMaxDiscount
    );
    if (switchToRange) {
      switchToRange = [switchToRange[0], switchToApy];
    }
  }

  return (
    <>
      <Row caption={<Trans>Borrow apy</Trans>} captionVariant="description" mb={4}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {loading ? (
            <Skeleton variant="rectangular" height={20} width={100} sx={{ borderRadius: '4px' }} />
          ) : (
            <>
              {displayGhoForMintableMarket({
                symbol: switchSource.reserve.symbol,
                currentMarket,
              }) && ghoData ? (
                <GhoIncentivesCard
                  useApyRange={false}
                  rangeValues={ghoData.ghoApyRange}
                  variant="main14"
                  color="text.secondary"
                  value={ghoData.userCurrentBorrowApy}
                  data-cy={`apyType`}
                  stkAaveBalance={ghoData.userDiscountTokenBalance}
                  ghoRoute={
                    ROUTES.reserveOverview(switchSource.underlyingAsset ?? '', currentMarket) +
                    '/#discount'
                  }
                  forceShowTooltip
                  withTokenIcon={ghoData.qualifiesForDiscount}
                  userQualifiesForDiscount={ghoData.qualifiesForDiscount}
                />
              ) : (
                <FormattedNumber value={sourceBorrowAPY} variant="secondary14" percent />
              )}
              {ArrowRightIcon}
              {displayGhoForMintableMarket({
                symbol: switchTarget.reserve.symbol,
                currentMarket,
              }) && ghoData ? (
                <GhoIncentivesCard
                  useApyRange={ghoData.qualifiesForDiscount && !ghoData.inputAmount}
                  rangeValues={ghoData.inputAmount === 0 ? ghoData.ghoApyRange : switchToRange}
                  variant="main14"
                  color="text.secondary"
                  value={
                    ghoData.inputAmount === 0 ? ghoData.userBorrowApyAfterMaxSwitch : switchToApy
                  }
                  data-cy={`apyType`}
                  stkAaveBalance={ghoData.userDiscountTokenBalance}
                  ghoRoute={
                    ROUTES.reserveOverview(switchTarget.underlyingAsset ?? '', currentMarket) +
                    '/#discount'
                  }
                  forceShowTooltip
                  withTokenIcon={ghoData.qualifiesForDiscount}
                  userQualifiesForDiscount={ghoData.qualifiesForDiscount}
                />
              ) : (
                <FormattedNumber value={targetBorrowAPY} variant="secondary14" percent />
              )}
            </>
          )}
        </Box>
      </Row>

      <DetailsIncentivesLine
        incentives={switchSource.reserve.aIncentivesData}
        symbol={switchSource.reserve.symbol}
        futureIncentives={switchSource.reserve.aIncentivesData}
        futureSymbol={switchSource.reserve.symbol}
        loading={loading}
      />

      <Row
        caption={<Trans>Borrow balance after switch</Trans>}
        captionVariant="description"
        mb={4}
        align="flex-start"
      >
        <Box sx={{ textAlign: 'right' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            {loading ? (
              skeleton
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TokenIcon
                    symbol={switchSource.reserve.iconSymbol}
                    sx={{ mr: 2, ml: 4, fontSize: '16px' }}
                  />
                  <FormattedNumber
                    value={sourceAmountAfterSwap.toString()}
                    variant="secondary14"
                    compact
                  />
                </Box>
                <FormattedNumber
                  value={sourceAmountAfterSwap
                    .multipliedBy(valueToBigNumber(switchSource.reserve.priceInUSD))
                    .toString()}
                  variant="helperText"
                  compact
                  symbol="USD"
                  symbolsColor="text.secondary"
                  color="text.secondary"
                />
              </>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
            mt={2}
          >
            {loading ? (
              skeleton
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TokenIcon
                    symbol={switchTarget.reserve.iconSymbol}
                    sx={{ mr: 2, ml: 4, fontSize: '16px' }}
                  />
                  <FormattedNumber
                    value={targetAmountAfterSwap.toString()}
                    variant="secondary14"
                    compact
                  />
                </Box>
                <FormattedNumber
                  value={targetAmountAfterSwap
                    .multipliedBy(valueToBigNumber(switchTarget.reserve.priceInUSD))
                    .toString()}
                  variant="helperText"
                  compact
                  symbol="USD"
                  symbolsColor="text.secondary"
                  color="text.secondary"
                />
              </>
            )}
          </Box>
        </Box>
      </Row>
    </>
  );
};
