/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom/extend-expect";
import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import ErrorPage from "../views/ErrorPage.js";

$.fn.modal = jest.fn();

jest.mock("../app/store", () => mockStore);

beforeAll(() => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "employee@test.tld",
      status: "connected",
    })
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByTestId("icon-window"));

      const windowIcon = screen.getByTestId("icon-window");

      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);

      const chrono = (a, b) => (a < b ? -1 : 1);
      const datesSorted = [...dates].sort(chrono);
      expect(dates).toEqual(datesSorted);
    });

    test("Then clicking on the new bill button should navigate to NewBill page", () => {
      const onNavigate = jest.fn();
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      document.body.innerHTML = BillsUI({ data: bills });

      const buttonNewBill = screen.getByTestId("btn-new-bill");
      buttonNewBill.addEventListener(
        "click",
        billsContainer.handleClickNewBill
      );

      fireEvent.click(buttonNewBill);

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    describe("When I click on the icon eye", () => {
      test("Then clicking on the eye icon should open the modal", async () => {
        const onNavigate = jest.fn();
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

        document.body.innerHTML = BillsUI({ data: bills });

        const iconEye = screen.getAllByTestId("icon-eye")[0];

        $.fn.modal = jest.fn();
        const handleClickIconEyeSpy = jest.spyOn(
          billsContainer,
          "handleClickIconEye"
        );

        iconEye.addEventListener("click", () =>
          billsContainer.handleClickIconEye(iconEye)
        );

        fireEvent.click(iconEye);

        expect(handleClickIconEyeSpy).toHaveBeenCalled();

        expect($.fn.modal).toHaveBeenCalledWith("show");
      });
    });

    describe("When bills are being fetched from Api", () => {
      beforeAll(() => {
        jest.spyOn(mockStore.bills(), "list");
      });

      beforeEach(() => {
        localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "test@test.tld",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);

        router();
      });

      describe("When an error occurs on API", () => {
        test("fetches messages from an API and fails with 404 message error", async () => {
          const error = new Error("Erreur 404");
          jest.spyOn(mockStore.bills(), "list").mockRejectedValueOnce(error);

          window.onNavigate(ROUTES_PATH.Bills);

          await waitFor(() => {
            expect(screen.getByText(/Erreur 404/)).toBeTruthy();
            expect(document.body).toMatchSnapshot(ErrorPage(error));
          });
        });

        test("fetches messages from an API and fails with 500 message error", async () => {
          const error = new Error("Erreur 500");
          jest.spyOn(mockStore.bills(), "list").mockRejectedValueOnce(error);

          window.onNavigate(ROUTES_PATH.Bills);

          await waitFor(() => {
            expect(screen.getByText(/Erreur 500/)).toBeTruthy();
            expect(document.body).toMatchSnapshot(ErrorPage(error));
          });
        });
      });
    });
  });
});
