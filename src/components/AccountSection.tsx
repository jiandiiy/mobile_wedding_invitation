import { useEffect, useMemo, useState, useRef } from 'react';

import type { WeddingConfig } from '../types/wedding';
import { Toast } from './Toast';

type AccountOwner = 'groom' | 'bride';

type AccountSectionProps = {
  config: WeddingConfig;
};

const ACCOUNT_OWNER_LABEL: Record<AccountOwner, string> = {
  groom: '신랑측',
  bride: '신부측',
};

const ACCOUNT_OWNERS: AccountOwner[] = ['groom', 'bride'];

export function AccountSection({ config }: AccountSectionProps) {
  const { accounts } = config;

  const [selectedOwner, setSelectedOwner] = useState<AccountOwner>('groom');
  const [toastMessage, setToastMessage] = useState('');
  const sectionRef = useRef<HTMLDivElement>(null);

  const selectedAccounts = useMemo(
    () => accounts[selectedOwner] ?? [],
    [accounts, selectedOwner],
  );

  const handleSelectOwner = (owner: AccountOwner) => {
    setSelectedOwner(owner);
  };

  const handleCopyAccountNumber = async (accountNumber: string) => {
  console.log('클릭됨');
  
  try {
    await navigator.clipboard.writeText(accountNumber);
    console.log('복사 성공');
    setToastMessage('계좌번호가 복사되었습니다.');
  } catch (error) {
    console.error('복사 실패:', error);
    setToastMessage('복사에 실패했습니다. 계좌번호를 직접 선택해 주세요.');
  }
};

  useEffect(() => {
    if (!toastMessage) return;

    const timerId = window.setTimeout(() => {
      setToastMessage('');
    }, 2200);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [toastMessage]);

  return (
    <section className="account-section is-visible" ref={sectionRef}>
      <h2>Wedding Gift</h2>

      <div className="account-tabs" role="tablist" aria-label="계좌 정보 선택">
        {ACCOUNT_OWNERS.map((owner) => {
          const isSelected = selectedOwner === owner;

          return (
            <button
              key={owner}
              type="button"
              className={`account-tab${isSelected ? ' is-selected' : ''}`}
              onClick={() => handleSelectOwner(owner)}
              role="tab"
              aria-selected={isSelected}
            >
              {ACCOUNT_OWNER_LABEL[owner]}
            </button>
          );
        })}
      </div>

      <div className="account-panel" role="tabpanel">
        {selectedAccounts.map((account, index) => (
          <div
            key={`${selectedOwner}-${account.relation}-${account.holder}-${account.number}-${index}`}
            className="account-row"
          >
            <div className="account-row__person">
              <span>{account.relation}</span>
              <strong>{account.holder}</strong>
            </div>

            <div className="account-row__info">
              <span>{account.bank}</span>
              <strong>{account.number}</strong>
            </div>

            <button
              type="button"
              className="account-row__copy"
              onClick={() => handleCopyAccountNumber(account.number)}
              aria-label={`${account.holder} 계좌번호 복사`}
            >
              <span aria-hidden="true" className="copy-icon" />
            </button>
          </div>
        ))}
      </div>

       <Toast message={toastMessage} parentRef={sectionRef} />
    </section>
  );
}