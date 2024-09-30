/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

jest.mock("../app/store", () => ({
  bills: () => ({
    list: jest.fn().mockResolvedValue([
      {
        id: 1,
        date: "2021-11-10",
        status: "pending",
        name: "Bill 1",
        amount: 100,
        fileUrl: "test.jpg",
      },
      {
        id: 2,
        date: "2021-11-09",
        status: "accepted",
        name: "Bill 2",
        amount: 200,
        fileUrl: "test2.jpg",
      },
    ]),
  }),
}));

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
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

    test("Integration test: fetches bills from API using getBills", async () => {
      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: {
          bills: () => ({
            list: jest.fn().mockResolvedValueOnce([
              {
                id: 1,
                date: "2021-11-10",
                status: "pending",
                name: "Bill 1",
                amount: 100,
                fileUrl: "test.jpg",
              },
              {
                id: 2,
                date: "2021-11-09",
                status: "accepted",
                name: "Bill 2",
                amount: 200,
                fileUrl: "test2.jpg",
              },
            ]),
          }),
        },
        localStorage: window.localStorage,
      });

      const bills = await billsContainer.getBills();
      expect(bills.length).toBe(2);
      expect(bills[0].name).toBe("Bill 1");
      expect(bills[1].status).toBe("Accepté");
    });
  });
});
