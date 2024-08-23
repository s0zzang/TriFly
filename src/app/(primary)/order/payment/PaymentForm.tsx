"use client";

import { modalState, orderState } from "@/atoms/atoms";
import Badge from "@/components/Badge/Badge";
import Submit from "@/components/Submit/Submit";
import orderAction from "@/data/actions/orderAction";
import usePersonalPrice from "@/hook/usePersonalPrice";
import { countries } from "@/lib/countries";
import { IMPData, Purchaser } from "@/types";
import { User } from "next-auth";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRecoilValue, useSetRecoilState } from "recoil";
import OrderContext from "../orderContext";

export interface PaymentPassenger {
  type: "adult" | "child" | "infant";
  nameKor: string;
  gender: "F" | "M";
  nameEngLast: string;
  nameEngFirst: string;
  birth: string;
  phone1: string;
  phone2: string;
  phone3: string;
  passport: { number: string; expDate: string };
  nationality: string;
  issueCountry: string;
  email: string;
}

interface PaymentPurchaser extends Purchaser {
  phone1: string;
  phone2: string;
  phone3: string;
  emergencyPhone1: string;
  emergencyPhone2: string;
  emergencyPhone3: string;
}

export type PaymentData = {
  purchaser: PaymentPurchaser;
  passengers: {
    [key: string]: PaymentPassenger;
  };
};

const PaymentForm = ({ user }: { user: User | undefined }) => {
  const router = useRouter();
  const setModal = useSetRecoilState(modalState);
  const { setOrderStatus } = useContext(OrderContext);
  const { totalPrice, itineraries, price } = useRecoilValue(orderState);
  const passengers = usePersonalPrice();
  const [clickedTitle, setClickedTitle] = useState(["0-0"]);
  const [nameEngLast, setNameEngLast] = useState("");
  const [nameEngFirst, setNameEngFirst] = useState("");
  const [passportNumber, setPassportNumber] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentData>();

  const handleInfoClick = (uniqueIdx: string) => {
    setClickedTitle(
      clickedTitle.includes(uniqueIdx)
        ? clickedTitle.filter((item) => item !== uniqueIdx)
        : [...clickedTitle, uniqueIdx],
    );
  };

  const handleUpperCase = (str: string) =>
    str.replace(/./g, (item) => item.toUpperCase());

  const handleForm = (formData: PaymentData) => {
    let totalNum = 0;
    passengers.map((item) => {
      totalNum += item.length;
      return null;
    });
    const charge = totalNum * +process.env.NEXT_PUBLIC_CHARGE!;
    const finalPrice = +totalPrice + charge;

    // 결제
    const { IMP } = window;
    IMP.init(process.env.NEXT_PUBLIC_MERCHANT_CODE as string);
    IMP.request_pay(
      {
        pg: "tosspayments.iamporttest_3",
        pay_method: "card",
        merchant_uid:
          new Date().getTime() + Math.floor(Math.random() * 1000000),
        name: "항공권 구매",
        amount: finalPrice,
        buyer_name: formData.purchaser.name,
        buyer_tel: `${formData.purchaser.phone1}-${formData.purchaser.phone2}-${formData.purchaser.phone3}`,
        buyer_email: formData.purchaser.email,
      },

      async (res: IMPData) => {
        try {
          if (res.error_code) {
            setModal({
              isOpen: true,
              title: "안내",
              content: "결제를 취소하셨습니다.",
              buttonNum: 1,
              handleConfirm: () => {},
              handleCancel: () => {},
            });
          } else {
            // 결제 성공 후 주문 api 통신
            const result = await orderAction(
              formData,
              itineraries,
              price,
              finalPrice,
            );
            setModal({
              isOpen: true,
              title: "안내",
              content:
                "항공권 구매가 완료되었습니다. \n좌석 선택 화면으로 이동합니다.",
              buttonNum: 1,
              handleConfirm: () => router.push(`/order/seat-map/${result._id}`),
              handleCancel: () => {},
            });
          }
        } catch {
          setModal({
            isOpen: true,
            title: "안내",
            content:
              "일시적인 오류가 발생했습니다. \n잠시 후 다시 시도해주세요.",
            buttonNum: 1,
            handleConfirm: () => {},
            handleCancel: () => {},
          });
        }
      },
    );
  };

  useEffect(() => {
    setOrderStatus(2);
  }, []);

  return (
    <form className="input-form" onSubmit={handleSubmit(handleForm)}>
      <div className="input-inner reservation">
        <h3 className="title">예약자 정보</h3>
        <div className="input-flex">
          <div className="input-box">
            <label htmlFor="name">
              이름
              <span className="errorMsg">
                {errors && errors.purchaser?.name?.message}
              </span>
            </label>
            <input
              type="text"
              id="name"
              placeholder="이름을 입력하세요"
              defaultValue={user?.name || ""}
              {...register("purchaser.name", {
                required: "이름을 입력하세요.",
                minLength: {
                  value: 2,
                  message: "이름을 2글자 이상 입력하세요.",
                },
              })}
            />
          </div>
          <div className="input-box">
            <label htmlFor="birth">
              생년월일
              <span className="errorMsg">
                {errors && errors.purchaser?.birth?.message}
              </span>
            </label>
            <input
              type="tel"
              id="birth"
              maxLength={8}
              defaultValue={user?.birth || ""}
              {...register("purchaser.birth", {
                minLength: {
                  value: 8,
                  message: "생년월일 8자리를 입력해주세요.",
                },
              })}
              placeholder="20020101"
            />
          </div>
          <div className="input-box">
            <label htmlFor="email">
              이메일
              <span className="errorMsg">
                {errors && errors.purchaser?.email?.message}
              </span>
            </label>
            <input
              id="email"
              placeholder="이메일을 입력하세요"
              type="text"
              defaultValue={user?.email || ""}
              {...register("purchaser.email")}
            />
          </div>
          <div className="input-box">
            <label htmlFor="phone1">
              휴대폰 번호
              <span className="errorMsg">
                {/* {errors?.purchaser?.phone1
                  ? errors.purchaser?.phone1?.message
                  : errors?.purchaser?.phone2
                    ? errors.purchaser?.phone2?.message
                    : errors?.purchaser?.phone3 &&
                      errors.purchaser?.phone3?.message} */}
              </span>
            </label>
            <div className="input-phone">
              <input
                type="tel"
                id="phone1"
                maxLength={3}
                placeholder="010"
                defaultValue={user?.phone.split("-")[0]}
                {...register("purchaser.phone1", {
                  required: "핸드폰 번호를 입력하세요.",
                  minLength: {
                    value: 2,
                    message: "핸드폰 번호를 입력하세요.",
                  },
                  pattern: {
                    value: /^[0-9]*$/,
                    message: "숫자만 입력해주세요.",
                  },
                })}
              />
              -
              <input
                type="tel"
                id="phone2"
                maxLength={4}
                placeholder="1234"
                defaultValue={user?.phone.split("-")[1]}
                {...register("purchaser.phone2", {
                  required: "핸드폰 번호를 입력하세요.",
                  minLength: {
                    value: 3,
                    message: "핸드폰 번호를 입력하세요.",
                  },
                  pattern: {
                    value: /^[0-9]*$/,
                    message: "숫자만 입력해주세요.",
                  },
                })}
              />
              -
              <input
                type="tel"
                id="phone3"
                maxLength={4}
                placeholder="5678"
                defaultValue={user?.phone.split("-")[2]}
                {...register("purchaser.phone3", {
                  required: "핸드폰 번호를 입력하세요.",
                  minLength: {
                    value: 4,
                    message: "핸드폰 번호를 입력하세요.",
                  },
                  pattern: {
                    value: /^[0-9]*$/,
                    message: "숫자만 입력해주세요.",
                  },
                })}
              />
            </div>
          </div>
          <div className="input-box">
            <label htmlFor="emergencyPhone1">
              비상 연락처
              <span className="errorMsg">
                {/* {errors?.emergencyPhone1
              ? errors.emergencyPhone1?.message
              : errors?.emergencyPhone2
                ? errors.emergencyPhone2?.message
                : errors?.emergencyPhone3 && errors.emergencyPhone3?.message} */}
              </span>
            </label>
            <div className="input-phone">
              <input
                type="tel"
                id="emergencyPhone1"
                maxLength={3}
                placeholder="010"
                {...register("purchaser.emergencyPhone1", {
                  required: "비상 연락처를 입력하세요.",
                  minLength: {
                    value: 2,
                    message: "비상 연락처를 입력하세요.",
                  },
                  pattern: {
                    value: /^[0-9]*$/,
                    message: "숫자만 입력해주세요.",
                  },
                })}
              />
              -
              <input
                type="tel"
                id="emergencyPhone2"
                maxLength={4}
                placeholder="1234"
                {...register("purchaser.emergencyPhone2", {
                  required: "비상 연락처를 입력하세요.",
                  minLength: {
                    value: 3,
                    message: "비상 연락처를 입력하세요.",
                  },
                  pattern: {
                    value: /^[0-9]*$/,
                    message: "숫자만 입력해주세요.",
                  },
                })}
              />
              -
              <input
                type="tel"
                id="emergencyPhone3"
                maxLength={4}
                placeholder="5678"
                {...register("purchaser.emergencyPhone3", {
                  required: "비상 연락처를 입력하세요.",
                  minLength: {
                    value: 4,
                    message: "비상 연락처를 입력하세요.",
                  },
                  pattern: {
                    value: /^[0-9]*$/,
                    message: "숫자만 입력해주세요.",
                  },
                })}
              />
            </div>
          </div>
        </div>
        <ul className="info-box">
          <li>
            탑승객의 승객정보 의무 수집 강화로 인해 비상연락처를 필수로 입력해야
            합니다.
          </li>
        </ul>
      </div>

      <div className="input-inner passenger">
        <h3 className="title">탑승자 정보</h3>
        <div className="input-toggle">
          {passengers.map((item, idx) => {
            if (!item.length) return false;
            const type = idx === 0 ? "성인" : idx === 1 ? "소아" : "유아";
            const typeEn = idx === 0 ? "adult" : idx === 1 ? "child" : "infant";

            return item.map((_, count) => {
              const key = `[${typeEn}_${count}]`;
              const uniqueIdx = `${idx}-${count}`;

              return (
                <div
                  key={`${typeEn}${count}`}
                  className={`information ${!clickedTitle.includes(uniqueIdx) ? "hide" : ""}`}
                >
                  <h4>
                    <button
                      type="button"
                      className={`${typeEn}`}
                      onClick={() => handleInfoClick(uniqueIdx)}
                      onKeyDown={() => handleInfoClick(uniqueIdx)}
                    >
                      <Badge type={type === "성인" ? "primary" : "gray"}>
                        {type}
                      </Badge>
                      탑승자 정보 <span className="count">{count + 1}</span>
                    </button>
                  </h4>

                  <div className="input-flex">
                    <input
                      type="hidden"
                      value={typeEn}
                      {...register(`passengers.${key}.type`)}
                    />
                    <div className="input-box">
                      <label htmlFor="nameKor">
                        이름
                        <span className="errorMsg">
                          {/* {errors && errors.passengers?.[key]?.nameKor?.message} */}
                        </span>
                      </label>
                      <input
                        id="nameKor"
                        placeholder="이름을 입력하세요"
                        type="text"
                        {...register(`passengers.${key}.nameKor`, {
                          required: "이름을 입력하세요.",
                          minLength: {
                            value: 2,
                            message: "이름을 2글자 이상 입력하세요.",
                          },
                        })}
                      />
                    </div>
                    <div className="input-box">
                      <label htmlFor="gender">
                        성별
                        <span className="errorMsg">
                          {/* {errors && errors.passengers?.[key]?.gender?.message} */}
                        </span>
                      </label>
                      <div className="radio-box">
                        <input
                          id="genderM"
                          type="radio"
                          value="M"
                          className="hidden"
                          {...register(`passengers.${key}.gender`, {
                            required: "성별을 선택하세요.",
                          })}
                        />
                        <label htmlFor="genderM">남자</label>
                        <input
                          id="genderF"
                          type="radio"
                          value="F"
                          className="hidden"
                          {...register(`passengers.${key}.gender`, {
                            required: "성별을 선택하세요.",
                          })}
                        />
                        <label htmlFor="genderF">여자</label>
                      </div>
                    </div>

                    <div className="input-box">
                      <label htmlFor="nameEngLast">
                        영문 성
                        <span className="errorMsg">
                          {/* {errors &&
                            errors.passengers?.[key]?.nameEngLast?.message} */}
                        </span>
                      </label>
                      <input
                        id="nameEngLast"
                        placeholder="영문 성을 입력하세요"
                        type="text"
                        {...register(`passengers.${key}.nameEngLast`, {
                          required: "영문 성을 입력하세요.",
                        })}
                        value={nameEngLast}
                        onChange={(e) =>
                          setNameEngLast(handleUpperCase(e.target.value))
                        }
                      />
                    </div>
                    <div className="input-box">
                      <label htmlFor="nameEngFirst">
                        영문 이름
                        <span className="errorMsg">
                          {/* {errors &&
                            errors.passengers?.[key]?.nameEngFirst?.message} */}
                        </span>
                      </label>
                      <input
                        id="nameEngFirst"
                        placeholder="영문 이름을 입력하세요"
                        type="text"
                        {...register(`passengers.${key}.nameEngFirst`, {
                          required: "영문 이름을 입력하세요.",
                        })}
                        value={nameEngFirst}
                        onChange={(e) =>
                          setNameEngFirst(handleUpperCase(e.target.value))
                        }
                      />
                    </div>
                    <div className="input-box">
                      <label htmlFor="birth">
                        생년월일
                        <span className="errorMsg">
                          {/* {errors && errors.passengers?.[key]?.birth?.message} */}
                        </span>
                      </label>
                      <input
                        type="tel"
                        maxLength={8}
                        placeholder="20020101"
                        {...register(`passengers.${key}.birth`, {
                          required: "생년월일을 입력하세요.",
                          minLength: {
                            value: 8,
                            message: "생년월일 8자리를 입력해주세요.",
                          },
                          pattern: {
                            value: /^[0-9]*$/,
                            message: "숫자만 입력해주세요.",
                          },
                        })}
                      />
                    </div>
                    <div className="input-box">
                      <label htmlFor="phone1">
                        휴대폰 번호
                        {/* <span className="errorMsg"></span> */}
                      </label>
                      <div className="input-phone">
                        <input
                          type="tel"
                          id="phone1"
                          maxLength={3}
                          placeholder="010"
                          {...register(`passengers.${key}.phone1`, {
                            required: "핸드폰 번호를 입력하세요.",
                            minLength: {
                              value: 2,
                              message: "핸드폰 번호를 입력하세요.",
                            },
                            pattern: {
                              value: /^[0-9]*$/,
                              message: "숫자만 입력해주세요.",
                            },
                          })}
                        />
                        -
                        <input
                          type="tel"
                          id="phone2"
                          maxLength={4}
                          placeholder="1234"
                          {...register(`passengers.${key}.phone2`, {
                            required: "핸드폰 번호를 입력하세요.",
                            minLength: {
                              value: 3,
                              message: "핸드폰 번호를 입력하세요.",
                            },
                            pattern: {
                              value: /^[0-9]*$/,
                              message: "숫자만 입력해주세요.",
                            },
                          })}
                        />
                        -
                        <input
                          type="tel"
                          id="phone3"
                          maxLength={4}
                          placeholder="5678"
                          {...register(`passengers.${key}.phone3`, {
                            required: "핸드폰 번호를 입력하세요.",
                            minLength: {
                              value: 4,
                              message: "핸드폰 번호를 입력하세요.",
                            },
                            pattern: {
                              value: /^[0-9]*$/,
                              message: "숫자만 입력해주세요.",
                            },
                          })}
                        />
                      </div>
                    </div>
                    <div className="input-box">
                      <label htmlFor="passport.number">
                        여권 번호
                        <span className="errorMsg">
                          {/* {errors &&
                            errors.passengers?.[key]?.passport.number?.message} */}
                        </span>
                      </label>
                      <input
                        type="text"
                        placeholder="M12345678"
                        maxLength={9}
                        {...register(`passengers.${key}.passport.number`, {
                          minLength: {
                            value: 9,
                            message: "여권 번호를 확인해주세요.",
                          },
                        })}
                        value={passportNumber}
                        onChange={(e) =>
                          setPassportNumber(handleUpperCase(e.target.value))
                        }
                      />
                    </div>
                    <div className="input-box">
                      <label htmlFor="passport.expDate">
                        여권 만료일
                        <span className="errorMsg">
                          {/* {errors &&
                            errors.passengers?.[key]?.passport.expDate?.message} */}
                        </span>
                      </label>
                      <input
                        type="tel"
                        maxLength={8}
                        placeholder="20020101"
                        {...register(`passengers.${key}.passport.expDate`, {
                          minLength: {
                            value: 8,
                            message: "여권 만료일 8자리를 입력해주세요.",
                          },
                          pattern: {
                            value: /^[0-9]*$/,
                            message: "숫자만 입력해주세요.",
                          },
                        })}
                      />
                    </div>
                    <div className="input-box">
                      <label htmlFor={`passengers.${key}.nationality`}>
                        국적
                        <span className="errorMsg">
                          {/* {errors &&
                            errors.passengers?.[key]?.passport.nationality
                              ?.message} */}
                        </span>
                      </label>
                      <select {...register(`passengers.${key}.nationality`)}>
                        {countries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="input-box">
                      <label htmlFor={`passengers.${key}.issueCountry`}>
                        발행 국가
                        <span className="errorMsg">
                          {/* {errors &&
                            errors.passengers?.[key]?.passport.nationality
                              ?.message} */}
                        </span>
                      </label>
                      <select {...register(`passengers.${key}.issueCountry`)}>
                        {countries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="input-box">
                      <label htmlFor={`passengers.${key}.email`}>이메일</label>
                      <input
                        id="email"
                        placeholder="이메일을 입력하세요"
                        type="text"
                        {...register(`passengers.${key}.email`)}
                      />
                    </div>
                  </div>
                </div>
              );
            });
          })}
        </div>

        <ul className="info-box">
          <li>
            <strong>
              여권상의 정보와 꼭 동일하게 입력해주세요. 잘못된 정보 등록 시
              탑승할 수 없습니다.
            </strong>
            <br />
            (영문 성/이름 입력시 띄어쓰기나 &quot;-&quot;표시 없이 영문스펠링만
            정확히 입력해 주십시오)
          </li>
          <li>
            출발 24시간 전까지 꼭 정확한 여권 정보를 등록해주세요. <br />
            (미주 지역으로 여행하거나 경유시에는 출발 72시간 전까지 정확하게
            등록해주세요.)
          </li>
          <li>
            정확한 승객 정보 확인을 위해 탑승자별로 휴대폰 번호와 이메일을
            입력해주세요.
          </li>
        </ul>
      </div>

      <div className="btn-box">
        <Submit size="full">결제</Submit>
        <div className="info-box">
          <ul>
            <li>
              <strong>테스트 결제</strong>이므로 실제로 결제되지 않습니다.
            </li>
          </ul>
        </div>
      </div>
    </form>
  );
};

export default PaymentForm;
