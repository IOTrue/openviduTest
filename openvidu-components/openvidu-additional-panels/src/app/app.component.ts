import { Component } from "@angular/core";
import { TokenModel, PanelService, PanelType } from "openvidu-angular";
import { catchError, throwError as observableThrowError } from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Component({
	selector: "app-root",
	template: `
		<ov-videoconference [tokens]="tokens" [toolbarDisplaySessionName]="false">
			<div *ovToolbarAdditionalPanelButtons style="text-align: center;">
				<button mat-icon-button (click)="toggleMyPanel('my-panel')">
					<mat-icon>360</mat-icon>
				</button>
				<button mat-icon-button (click)="toggleMyPanel('my-panel2')">
					<mat-icon>star</mat-icon>
				</button>
			</div>
			<div *ovAdditionalPanels id="my-panels">
				<div id="my-panel1" *ngIf="showExternalPanel">
					<h2>NEW PANEL</h2>
					<p>This is my new additional panel</p>
				</div>
				<div id="my-panel2" *ngIf="showExternalPanel2">
					<h2>NEW PANEL 2</h2>
					<p>This is other new panel</p>
				</div>
			</div>
		</ov-videoconference>
	`,
	styles: [
		`
			#my-panels {
				height: 100%;
				overflow: hidden;
			}
			#my-panel1,
			#my-panel2 {
				text-align: center;
				height: calc(100% - 40px);
				margin: 20px;
			}
			#my-panel1 {
				background: #c9ffb2;
			}
			#my-panel2 {
				background: #ddf2ff;
			}
		`,
	],
})
export class AppComponent {
	title = "openvidu-additional-panels";
	tokens!: TokenModel;
	sessionId = "toolbar-additionalbtn-directive-example";
	OPENVIDU_SERVER_URL = "https://localhost:4443";
	OPENVIDU_SERVER_SECRET = "MY_SECRET";

	showExternalPanel: boolean = false;
	showExternalPanel2: boolean = false;

	constructor(
		private httpClient: HttpClient,
		private panelService: PanelService
	) {}

	ngOnInit() {
		this.subscribeToPanelToggling();
		this.tokens = {
			webcam: await this.getToken(),
			screen: await this.getToken(),
		};
	}
	subscribeToPanelToggling() {
		this.panelService.panelOpenedObs.subscribe(
			(ev: { opened: boolean; type?: PanelType | string }) => {
				this.showExternalPanel = ev.opened && ev.type === "my-panel";
				this.showExternalPanel2 = ev.opened && ev.type === "my-panel2";
			}
		);
	}

	toggleMyPanel(type: string) {
		this.panelService.togglePanel(type);
	}

	/**
	 * --------------------------
	 * SERVER-SIDE RESPONSIBILITY
	 * --------------------------
	 * This method retrieve the mandatory user token from OpenVidu Server,
	 * in this case making use Angular http API.
	 * This behavior MUST BE IN YOUR SERVER-SIDE IN PRODUCTION. In this case:
	 *   1) Initialize a Session in OpenVidu Server	(POST /openvidu/api/sessions)
	 *   2) Create a Connection in OpenVidu Server (POST /openvidu/api/sessions/<SESSION_ID>/connection)
	 *   3) The Connection.token must be consumed in Session.connect() method
	 */

	getToken(): Promise<string> {
		return this.createSession(this.sessionId).then((sessionId: string) => {
			return this.createToken(sessionId);
		});
	}

	createSession(sessionId: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const body = JSON.stringify({ customSessionId: sessionId });
			const options = {
				headers: new HttpHeaders({
					Authorization:
						"Basic " + btoa("OPENVIDUAPP:" + this.OPENVIDU_SERVER_SECRET),
					"Content-Type": "application/json",
				}),
			};
			return this.httpClient
				.post(
					this.OPENVIDU_SERVER_URL + "/openvidu/api/sessions",
					body,
					options
				)
				.pipe(
					catchError((error) => {
						if (error.status === 409) {
							resolve(sessionId);
						} else {
							console.warn(
								"No connection to OpenVidu Server. This may be a certificate error at " +
									this.OPENVIDU_SERVER_URL
							);
							if (
								window.confirm(
									'No connection to OpenVidu Server. This may be a certificate error at "' +
										this.OPENVIDU_SERVER_URL +
										'"\n\nClick OK to navigate and accept it. If no certificate warning is shown, then check that your OpenVidu Server' +
										'is up and running at "' +
										this.OPENVIDU_SERVER_URL +
										'"'
								)
							) {
								location.assign(
									this.OPENVIDU_SERVER_URL + "/accept-certificate"
								);
							}
						}
						return observableThrowError(error);
					})
				)
				.subscribe((response: any) => {
					console.log(response);
					resolve(response["id"]);
				});
		});
	}

	createToken(sessionId: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const body = {};
			const options = {
				headers: new HttpHeaders({
					Authorization:
						"Basic " + btoa("OPENVIDUAPP:" + this.OPENVIDU_SERVER_SECRET),
					"Content-Type": "application/json",
				}),
			};
			return this.httpClient
				.post(
					this.OPENVIDU_SERVER_URL +
						"/openvidu/api/sessions/" +
						sessionId +
						"/connection",
					body,
					options
				)
				.pipe(
					catchError((error) => {
						reject(error);
						return observableThrowError(error);
					})
				)
				.subscribe((response: any) => {
					console.log(response);
					resolve(response["token"]);
				});
		});
	}
}
